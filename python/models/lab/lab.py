import os, re, json, logging, sys, time
from typing import List, Dict, Tuple, Optional
import requests
import pandas as pd
from rapidfuzz import process, fuzz
from groq import Groq
from dotenv import load_dotenv

# === Load environment variables ===
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY_LAB")
OCR_SPACE_API_KEY = os.getenv("OCR_SPACE_API_KEY_LAB")

if not GROQ_API_KEY or not OCR_SPACE_API_KEY:
    raise ValueError("❌ Missing API keys in .env file! Check GROQ_API_KEY and OCR_SPACE_API_KEY.")

# Enhanced logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("healnova-labs")

# === Canonical tests & units ===
TEST_CANON = {
    "hemoglobin": {"syn": ["hemoglobin","hb"], "unit":"g/dL"},
    "rbc": {"syn": ["rbc","erythrocyte"], "unit":"x10^6/µL"},
    "wbc": {"syn": ["wbc","tlc","total leucocyte","total leukocyte"], "unit":"x10^3/µL"},
    "hematocrit": {"syn": ["hct","hematocrit","pcv"], "unit":"%"},
    "platelet": {"syn": ["platelet","plt","platelet count"], "unit":"x10^3/µL"},
    "neutrophils": {"syn": ["neutrophils","neut"], "unit":"%"},
    "lymphocytes": {"syn": ["lymphocytes","lymph"], "unit":"%"},
    "monocytes": {"syn": ["monocytes","mono"], "unit":"%"},
    "eosinophils": {"syn": ["eosinophils","eos"], "unit":"%"},
    "basophils": {"syn": ["basophils","baso"], "unit":"%"},
    "iron": {"syn": ["iron","serum iron"], "unit":"µg/dL"},
    "tibc": {"syn": ["tibc","total iron binding capacity"], "unit":"µg/dL"},
    "ferritin": {"syn": ["ferritin"], "unit":"ng/mL"},
    "hba1c": {"syn": ["hba1c","glycated hemoglobin"], "unit":"%"},
    "glucose_fasting": {"syn": ["glucose (fasting)","fasting glucose","fpg"], "unit":"mg/dL"},
    "crp": {"syn": ["crp","c-reactive protein","hs-crp"], "unit":"mg/L"},
    "microalbumin": {"syn": ["urine microalbumin","microalbumin","albumin (urine)"], "unit":"mg/L"},
    "acr": {"syn": ["uacr","acr","albumin/creatinine ratio","microalbumin/creatinine ratio"], "unit":"mg/g"},
}

RANGES = {
    "hemoglobin": (5,25), "rbc": (2.0,8.5), "wbc": (2.0,25.0), "hematocrit": (20,65),
    "platelet": (50,1000), "neutrophils": (20,90), "lymphocytes": (5,60),
    "monocytes": (1,20), "eosinophils": (0,15), "basophils": (0,3),
    "iron": (10,300), "tibc": (100,600), "ferritin": (5,1000), "hba1c": (3.5,18),
    "glucose_fasting": (40,400), "crp": (0,500), "microalbumin": (0,5000), "acr": (0,5000),
}

REQUIRED = list(TEST_CANON.keys())
ALL_SYNS = {s: k for k,v in TEST_CANON.items() for s in v["syn"]}
NUM_RE = re.compile(r"([-+]?\d+(?:[.,]\d+)?)")
UNIT_RE = re.compile(r"(mg/dL|µg/dL|ug/dL|ng/mL|x10\^3/µL|x10\^3/uL|x10\^6/µL|x10\^6/uL|%|mg/L|mg/g)", re.I)
OCR_URL = "https://api.ocr.space/parse/image"

# === Helper Functions with Debug Info ===
def detect_file_type(path: str) -> str:
    """Detect file type by reading file header (magic bytes)"""
    try:
        with open(path, 'rb') as f:
            header = f.read(16)
        
        # PDF magic bytes
        if header.startswith(b'%PDF'):
            return 'PDF'
        
        # PNG magic bytes
        elif header.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'PNG'
        
        # JPEG magic bytes
        elif header.startswith(b'\xff\xd8\xff'):
            return 'JPG'
        
        # GIF magic bytes
        elif header.startswith(b'GIF87a') or header.startswith(b'GIF89a'):
            return 'GIF'
        
        # BMP magic bytes
        elif header.startswith(b'BM'):
            return 'BMP'
        
        # TIFF magic bytes
        elif header.startswith(b'II*\x00') or header.startswith(b'MM\x00*'):
            return 'TIF'
        
        # WebP magic bytes
        elif header[8:12] == b'WEBP':
            return 'WEBP'
        
        else:
            # Try extension as fallback
            _, ext = os.path.splitext(path.lower())
            if ext == '.pdf':
                return 'PDF'
            elif ext in ['.jpg', '.jpeg']:
                return 'JPG'
            elif ext == '.png':
                return 'PNG'
            elif ext == '.gif':
                return 'GIF'
            elif ext == '.bmp':
                return 'BMP'
            elif ext in ['.tiff', '.tif']:
                return 'TIF'
            elif ext == '.webp':
                return 'WEBP'
            else:
                # Default to JPG for unknown image types
                return 'JPG'
                
    except Exception as e:
        logger.warning(f"Could not detect file type: {e}")
        return 'JPG'  # Safe default

def ocr_space_file(path: str, language: str = "eng") -> str:
    logger.info(f"Starting OCR for file: {path}")
    start_time = time.time()
    
    try:
        # Check if file exists
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {path}")
        
        # Check file size (OCR.Space has limits)
        file_size = os.path.getsize(path)
        logger.info(f"File size: {file_size} bytes")
        
        # OCR.Space free tier limit is 1MB
        if file_size > 1024 * 1024:  # 1MB
            logger.warning(f"File size ({file_size} bytes) may exceed OCR.Space limits")
        
        # Determine file type using magic bytes
        file_type = detect_file_type(path)
        logger.info(f"Detected file type: {file_type}")
        
        with open(path, "rb") as f:
            # Create a proper filename with extension for OCR.Space
            if file_type == 'PDF':
                filename = f"document.pdf"
            elif file_type == 'PNG':
                filename = f"image.png"
            elif file_type == 'JPG':
                filename = f"image.jpg"
            elif file_type == 'GIF':
                filename = f"image.gif"
            elif file_type == 'BMP':
                filename = f"image.bmp"
            elif file_type == 'TIF':
                filename = f"image.tiff"
            elif file_type == 'WEBP':
                filename = f"image.webp"
            else:
                filename = f"image.jpg"  # Safe default
            
            files = {filename: f}
            
            data = {
                "apikey": OCR_SPACE_API_KEY,
                "language": language,
                "isOverlayRequired": False,
                "OCREngine": 2,  # Engine 2 is usually better for complex documents
                "scale": True,
                "detectOrientation": True,
                "filetype": file_type  # Always specify the detected filetype
            }
            
            logger.info(f"Sending request to OCR.Space API with filename: {filename}, filetype: {file_type}")
            r = requests.post(OCR_URL, files=files, data=data, timeout=180)
        
        ocr_time = time.time() - start_time
        logger.info(f"OCR API response received in {ocr_time:.2f} seconds")
        
        r.raise_for_status()
        payload = r.json()
        
        # Enhanced error handling
        if payload.get("IsErroredOnProcessing"):
            error_details = payload.get("ErrorDetails", [])
            error_message = payload.get("ErrorMessage", ["Unknown OCR.Space error"])
            
            # Log detailed error information
            logger.error(f"OCR.Space processing error: {error_message}")
            if error_details:
                logger.error(f"Error details: {error_details}")
            
            # Handle specific error cases
            if any("E301" in str(err) for err in error_message):
                raise RuntimeError("OCR.Space cannot process this file. Try converting to a different format (JPEG/PNG for images, or ensure PDF is not corrupted)")
            elif any("file size" in str(err).lower() for err in error_message):
                raise RuntimeError("File size too large for OCR.Space. Try compressing the image or splitting the PDF")
            else:
                raise RuntimeError(f"OCR.Space error: {error_message}")
        
        parsed = payload.get("ParsedResults", [])
        if not parsed:
            raise RuntimeError("No text extracted from the document")
        
        text = "\n".join(p.get("ParsedText","") for p in parsed if p)
        
        if not text.strip():
            logger.warning("OCR completed but no text was extracted")
            return ""
        
        logger.info(f"OCR completed successfully. Extracted {len(text)} characters")
        return text
        
    except requests.exceptions.Timeout:
        logger.error("OCR API request timed out")
        raise RuntimeError("OCR API request timed out. Try with a smaller file or check your internet connection")
    except requests.exceptions.RequestException as e:
        logger.error(f"OCR API request failed: {e}")
        raise RuntimeError(f"OCR API request failed: {e}")
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        raise

def fuzzy_key(name: str, score_cut=82) -> Optional[str]:
    if not name: return None
    cand = process.extractOne(name.lower(), list(ALL_SYNS.keys()), scorer=fuzz.WRatio)
    if not cand: return None
    word, score, _ = cand
    return ALL_SYNS[word] if score >= score_cut else None

def parse_value_unit(text: str) -> Tuple[Optional[float], Optional[str]]:
    if not text: return None, None
    t = text.replace("ug/dL","µg/dL").replace("uL","µL")
    n = NUM_RE.search(t)
    u = UNIT_RE.search(t)
    val = float(n.group(1).replace(",", ".")) if n else None
    unit = u.group(1) if u else None
    return val, unit

def maybe_fix_decimal(val: float, key: str) -> float:
    lo, hi = RANGES.get(key, (None, None))
    if lo is None: return val
    if lo <= val <= hi: return val
    for f in (10,100,1000):
        v2 = val / f
        if lo <= v2 <= hi: return v2
    for f in (10,100):
        v2 = val * f
        if lo <= v2 <= hi: return v2
    return val

def normalize_record(name_guess: str, raw_val: float, raw_unit: Optional[str]) -> Optional[Dict]:
    k = fuzzy_key(name_guess)
    candidates = []
    for key, meta in TEST_CANON.items():
        expected_unit = meta["unit"]
        if raw_unit and raw_unit.lower() == expected_unit.lower():
            lo, hi = RANGES.get(key, (None, None))
            if lo is not None and lo <= raw_val <= hi:
                candidates.append(key)
    if not k and candidates: k = candidates[0]
    if not k: return None
    v = maybe_fix_decimal(raw_val, k)
    u = TEST_CANON[k]["unit"]
    return {"name": k, "value": v, "unit": u}

def parse_lines(text: str) -> List[Dict]:
    logger.info("Starting line-by-line parsing...")
    recs: List[Dict] = []
    for line in text.splitlines():
        s = line.strip()
        if not s: continue
        val, unit = parse_value_unit(s)
        if val is None: continue
        m = NUM_RE.search(s)
        left = s[:m.start()].strip() if m else s
        rec = normalize_record(left, val, unit)
        if rec: recs.append(rec)
    dedup = {r["name"]: r for r in recs}
    logger.info(f"Parsed {len(dedup)} unique test records")
    return list(dedup.values())

def qc_validate(records: List[Dict]) -> List[str]:
    notes = []
    R = {r["name"]: r for r in records}
    diffs = ["neutrophils","lymphocytes","monocytes","eosinophils","basophils"]
    if sum(1 for k in diffs if k in R) >= 3:
        s = sum(R[k]["value"] for k in diffs if k in R)
        if not (80 <= s <= 120):
            notes.append(f"Differential sum suspicious: {s:.1f}%")
    miss = [k for k in REQUIRED if k not in R]
    if miss: notes.append("Missing: " + ", ".join(miss))
    return notes

groq_client = Groq(api_key=GROQ_API_KEY)

def llm_extract_json(raw_text: str) -> str:
    logger.info("Starting LLM extraction...")
    start_time = time.time()
    
    prompt = (
        "Extract lab tests into strict JSON with this schema:\n"
        "{ \"Tests\": [{\"name\": string, \"value\": number, \"unit\": string}],"
        "  \"DocumentDate\": string|null, \"PatientID\": string|null }\n"
        "- Only output a single JSON object. No commentary.\n"
        "- Use these canonical names: " + ", ".join(TEST_CANON.keys()) + ".\n"
        "- Units must be exactly: " + ", ".join({v['unit'] for v in TEST_CANON.values()}) + ".\n"
    )
    
    supported_models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
    last_err = None
    
    for model in supported_models:
        try:
            logger.info(f"Trying model: {model}")
            resp = groq_client.chat.completions.create(
                model=model,
                temperature=0,
                response_format={"type": "json_object"},
                messages=[{"role": "user", "content": prompt + "\n\n" + raw_text[:4000]}],
            )
            
            llm_time = time.time() - start_time
            logger.info(f"LLM response received in {llm_time:.2f} seconds")
            return resp.choices[0].message.content
            
        except Exception as e:
            logger.warning(f"Model {model} failed: {e}")
            last_err = e
            continue
    
    raise RuntimeError(f"All Groq models failed. Last error: {last_err}")

def safe_parse_json(output: str) -> Dict:
    if not output: raise ValueError("Empty LLM output")
    cleaned = output.strip()
    if cleaned.startswith("```"):
        parts = cleaned.split("```")
        cleaned = "".join(p for i,p in enumerate(parts) if i%2==1 and not p.lower().startswith("json")).strip() \
                  or parts[1].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not m: raise
        return json.loads(m.group(0))

def merge_with_llm(raw_text: str, det: List[Dict]) -> List[Dict]:
    logger.info("Merging deterministic parsing with LLM results...")
    have = {r["name"] for r in det}
    try:
        llm_json = safe_parse_json(llm_extract_json(raw_text))
        llm_tests = llm_json.get("Tests", []) or []
        logger.info(f"LLM found {len(llm_tests)} additional tests")
    except Exception as e:
        logger.warning(f"LLM JSON parse failed: {e}")
        llm_tests = []
    
    merged = {r["name"]: r for r in det}
    for r in llm_tests:
        k_guess = r.get("name","")
        k = k_guess if k_guess in TEST_CANON else fuzzy_key(k_guess)
        if not k or k in merged: continue
        v_raw = r.get("value", None)
        try:
            v = float(str(v_raw).replace(",",".")) if v_raw is not None else None
        except Exception:
            v = None
        u = r.get("unit") or TEST_CANON[k]["unit"]
        if v is None: continue
        fixed = normalize_record(k, v, u)
        if fixed: merged[k] = fixed
    
    logger.info(f"Final merged records: {len(merged)}")
    return list(merged.values())

def records_to_df(records: list[dict]) -> pd.DataFrame:
    if not records: return pd.DataFrame(columns=["name","value","unit"])
    df = pd.DataFrame(records)
    for col in ["name","value","unit"]:
        if col not in df.columns: df[col] = None
    return df[["name","value","unit"]].sort_values("name").reset_index(drop=True)

# === MAIN FUNCTION WITH TIMEOUT AND BETTER ERROR HANDLING ===
def extract_file(path: str, timeout_seconds: int = 300) -> Dict:
    """
    Extract lab data from PDF or image file with timeout and comprehensive logging
    """
    start_time = time.time()
    logger.info(f"Starting file extraction for: {path}")
    
    # Validate file exists and get basic info
    if not os.path.exists(path):
        return {
            "success": False,
            "error": f"File not found: {path}",
            "error_type": "FileNotFoundError",
            "processing_time": 0
        }
    
    file_size = os.path.getsize(path)
    file_type = detect_file_type(path)
    logger.info(f"File size: {file_size} bytes, Type: {file_type}")
    
    try:
        # Step 1: OCR
        logger.info("Step 1/4: Starting OCR...")
        raw_text = ocr_space_file(path)
        
        if not raw_text.strip():
            return {
                "success": False,
                "error": "No text could be extracted from the file",
                "error_type": "EmptyTextError",
                "processing_time": time.time() - start_time
            }
        
        elapsed = time.time() - start_time
        if elapsed > timeout_seconds:
            raise TimeoutError(f"Process timed out after {elapsed:.1f} seconds")
        
        # Step 2: Deterministic parsing
        logger.info("Step 2/4: Starting deterministic parsing...")
        det = parse_lines(raw_text)
        
        elapsed = time.time() - start_time
        if elapsed > timeout_seconds:
            raise TimeoutError(f"Process timed out after {elapsed:.1f} seconds")
        
        # Step 3: LLM enhancement
        logger.info("Step 3/4: Starting LLM enhancement...")
        recs = merge_with_llm(raw_text, det)
        
        elapsed = time.time() - start_time
        if elapsed > timeout_seconds:
            raise TimeoutError(f"Process timed out after {elapsed:.1f} seconds")
        
        # Step 4: Quality control
        logger.info("Step 4/4: Running quality control...")
        notes = qc_validate(recs)
        df = records_to_df(recs)
        
        total_time = time.time() - start_time
        logger.info(f"File extraction completed in {total_time:.2f} seconds")
        
        return {
            "success": True,
            "records": df.to_dict("records"),
            "notes": notes,
            "preview": raw_text[:500],
            "processing_time": total_time,
            "record_count": len(recs),
            "file_info": {
                "size": file_size,
                "type": file_type,
                "text_length": len(raw_text)
            }
        }
        
    except Exception as e:
        error_time = time.time() - start_time
        logger.error(f"File extraction failed after {error_time:.2f} seconds: {e}")
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "processing_time": error_time,
            "file_info": {
                "size": file_size,
                "type": file_type
            }
        }

# Backward compatibility
def extract_pdf(path: str, timeout_seconds: int = 300) -> Dict:
    """Backward compatibility wrapper"""
    return extract_file(path, timeout_seconds)

# === CLI SUPPORT WITH BETTER OUTPUT ===
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "No file path provided", 
            "usage": "python script.py <file_path>",
            "supported_formats": "PDF, JPEG, PNG, GIF, BMP, TIFF, WEBP"
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    try:
        result = extract_file(file_path)
        print(json.dumps(result, indent=2 if "--pretty" in sys.argv else None))
        
        # Exit with appropriate code
        sys.exit(0 if result["success"] else 1)
        
    except KeyboardInterrupt:
        print(json.dumps({
            "error": "Process interrupted by user"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "error_type": type(e).__name__
        }))
        sys.exit(1)