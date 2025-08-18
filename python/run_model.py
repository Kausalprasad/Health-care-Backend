import sys
import os
import json
import pytesseract
import pdfplumber
from PIL import Image
import fitz
import io
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException

# Required for anemia model
sys.path.append(os.path.join(os.path.dirname(__file__), "models", "anemia_nail"))
from predict import predict as anemia_predict  # ✅

# Optional: Tesseract path (Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Load .env
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY not set in .env")
    sys.exit(1)

# ----------- 🧠 OCR + PDF Summary Logic --------------
def ocr_with_preprocessing(img):
    gray = img.convert('L')
    custom_config = r'--oem 3 --psm 6'
    return pytesseract.image_to_string(gray, config=custom_config)

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text
    except Exception as e:
        print("pdfplumber failed:", e)

    if len(text.strip()) < 100:
        text = ""
        pdf_file = fitz.open(pdf_path)
        for page_index in range(len(pdf_file)):
            pix = pdf_file[page_index].get_pixmap(dpi=300)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text += ocr_with_preprocessing(img)

    return text.strip()

class Chain:
    def __init__(self):
        self.llm = ChatGroq(
            temperature=0,
            groq_api_key=GROQ_API_KEY,
            model_name="llama-3.3-70b-versatile"
        )

    def get_summary_chain(self):
        parser = JsonOutputParser()
        prompt = PromptTemplate(
            template="""
You are a medical AI assistant. Read the following medical report and summarize it in JSON format with:
- patient_condition
- diagnoses
- medications
- follow_ups

{format_instructions}

Medical Report:
{report}
""",
            input_variables=["report"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        return prompt | self.llm | parser

# ---------- 🔽 Entry Point ----------
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python run_model.py <model_name> <file_path>")
        sys.exit(1)

    model_name = sys.argv[1]
    file_path = sys.argv[2]

    if model_name == "pdf_summary":
        try:
            text = extract_text_from_pdf(file_path)
            chain = Chain()
            result = chain.get_summary_chain().invoke({"report": text})
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"error": f"PDF Summary failed: {str(e)}"}))

    elif model_name == "anemia_nail":
        try:
            result = anemia_predict(file_path)
            print(json.dumps(result))  # ✅ return proper JSON
        except Exception as e:
            print(json.dumps({"error": f"Anemia prediction failed: {str(e)}"}))

    else:
        print(json.dumps({"error": f"Unknown model name: {model_name}"}))
