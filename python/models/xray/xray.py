import sys
import json
import os
from byteplussdkarkruntime import Ark

# Initialize BytePlus client
os.environ["ARK_API_KEY"] = "8744a60d-f9b4-4208-b1cb-0451ba8a4d40"
client = Ark(
    api_key=os.environ.get("ARK_API_KEY"),
    base_url="https://ark.ap-southeast.bytepluses.com/api/v3"
)

BODY_PART_ANALYSIS_PROMPTS = {
    "chest_xray": "You are a thoracic radiologist. Analyze lungs, heart, pleura, bones.",
    "brain_mri": "You are a neuroradiologist. Evaluate brain anatomy, ventricles, vasculature.",
    "abdominal_ct": "Analyze abdominal organs: liver, pancreas, kidneys, spleen, bowel, vasculature.",
    "spine_mri": "Analyze vertebrae, discs, spinal canal, neural foramina.",
    "musculoskeletal": "Analyze bones, joints, muscles, soft tissues.",
    "full_body": "Perform full-body scan covering all organ systems."
}

def log(msg):
    print(f"[Python][Log] {msg}", file=sys.stderr)

def get_image_url(image_path):
    """Convert local file path to file:// URL or use absolute path"""
    abs_path = os.path.abspath(image_path)
    # BytePlus might accept file:// URLs or you need to host it
    return f"file://{abs_path}"

def detect_body_part(image_path):
    detection_prompt = "Identify the body system: chest_xray, brain_mri, abdominal_ct, spine_mri, musculoskeletal, full_body."
    try:
        log("Detecting body part...")
        image_url = get_image_url(image_path)
        
        response = client.chat.completions.create(
            model="skylark-vision-250515",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": detection_prompt},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            }],
            max_tokens=50,
            temperature=0.1,
        )
        detected = response.choices[0].message.content.strip().lower()
        log(f"Detected body part: {detected}")
        return detected if detected in BODY_PART_ANALYSIS_PROMPTS else "chest_xray"
    except Exception as e:
        log(f"Error detecting body part: {e}")
        return "chest_xray"

def analyze_image(image_path):
    try:
        log("Starting analysis...")
        
        if not os.path.exists(image_path):
            return {"success": False, "error": f"Image not found: {image_path}"}
        
        body_part = detect_body_part(image_path)
        prompt = BODY_PART_ANALYSIS_PROMPTS.get(body_part, BODY_PART_ANALYSIS_PROMPTS["full_body"])
        image_url = get_image_url(image_path)

        response = client.chat.completions.create(
            model="skylark-vision-250515",
            messages=[
                {"role": "system", "content": f"You are an expert radiologist analyzing {body_part}."},
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]}
            ],
            max_tokens=3000,
            temperature=0.3,
        )
        report = response.choices[0].message.content
        return {"success": True, "body_part": body_part, "report": report}
    except Exception as e:
        log(f"Analysis error: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    try:
        command = sys.argv[1]
        image_path = sys.argv[2]
        if command == "analyze":
            result = analyze_image(image_path)
            print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))