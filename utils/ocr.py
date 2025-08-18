from PIL import Image
import pytesseract

# Optional: Windows Tesseract path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def ocr_with_preprocessing(img: Image.Image) -> str:
    gray = img.convert('L')
    custom_config = r'--oem 3 --psm 6'
    return pytesseract.image_to_string(gray, config=custom_config)
