import sys
import os
import base64
from PIL import Image
from io import BytesIO
from pdf2image import convert_from_path
import google.generativeai as genai
import json
import re
import traceback

# Paths
POPPLER_PATH = r"C:\tools\Release-24.08.0-0\poppler-24.08.0\Library\bin"

# Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print(json.dumps({"error": "GEMINI_API_KEY not set"}))
    sys.exit(1)

genai.configure(api_key=API_KEY)
MODEL = genai.GenerativeModel("gemini-2.0-flash")

def encode_image_to_base64(image_path):
    with Image.open(image_path) as img:
        # 🛠 Convert RGBA → RGB if needed
        if img.mode == "RGBA":
            img = img.convert("RGB")
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")

def extract_json(text):
    try:
        return json.loads(text)
    except:
        match = re.search(r"\{.*\}", text, re.S)
        if match:
            return json.loads(match.group(0))
        return {"error": "No valid JSON in model output"}

def process_file(file_path):
    if file_path.lower().endswith(".pdf"):
        images = convert_from_path(file_path, dpi=300, poppler_path=POPPLER_PATH)
        image_path = file_path + "_page1.jpg"
        
        # 🛠 Ensure PDF page image is in RGB mode
        img = images[0]
        if img.mode == "RGBA":
            img = img.convert("RGB")
        img.save(image_path, "JPEG")
    else:
        image_path = file_path

    b64_image = encode_image_to_base64(image_path)

    prompt = """
    You are a medical AI that reads prescriptions and outputs structured JSON.

    Return ONLY valid JSON with:
    - patient_details
    - patient_condition
    - diagnoses
    - medications
    - dosage
    - duration
    - follow_ups
    - other_notes
    """

    response = MODEL.generate_content(
        contents=[
            prompt,
            {
                "mime_type": "image/jpeg",
                "data": base64.b64decode(b64_image)
            }
        ],
        generation_config={
            "response_mime_type": "application/json"
        }
    )

    return extract_json(getattr(response, "text", ""))

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]
    try:
        result = process_file(file_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "trace": traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
