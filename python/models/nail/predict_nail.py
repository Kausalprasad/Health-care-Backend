import sys
import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image

# Get the directory of this script (so paths work no matter where Node calls Python from)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths
model_path = os.path.join(BASE_DIR, "nail_Model.tflite")
labels_path = os.path.join(BASE_DIR, "labels.txt")

# Load labels
with open(labels_path, "r") as f:
    lines = f.readlines()
    labels = {int(line.split()[0]): line.split(" ", 1)[1].strip() for line in lines}




# ---- Nail Recommendations ----
recommendations = {
    "normal": {
        "recommendedCosmetics": [
            "Mild nail strengtheners and moisturizers with vitamins E & B5",
            "Acetone-free nail polish remover"
        ],
        "homeRemedies": [
            "Keep nails clean and dry",
            "Regular filing and gentle trimming"
        ],
        "timeFrame": "Ongoing daily care",
        "associatedConditions": "Healthy nails indicate no disease"
    },
    "beau's line": {
        "recommendedCosmetics": ["Cosmetic filling with gel nails for appearance"],
        "homeRemedies": [
            "No specific home remedy; nails grow out over time",
            "Treat underlying causes (illness, chemotherapy, stress)"
        ],
        "timeFrame": "Grows out as new nails regenerate, usually weeks to months",
        "associatedDiseases": "Severe illness, trauma, chemotherapy, infections, stress"
    },
    "black line": {
        "recommendedCosmetics": ["No specific cosmetics; medical evaluation needed"],
        "homeRemedies": ["Avoid trauma, monitor changes carefully"],
        "timeFrame": "Depends on cause; medical follow-up needed",
        "associatedDiseases": "Natural pigmentation, melanoma, trauma, medications, HIV, cancer"
    },
    "clubbing": {
        "recommendedCosmetics": ["No cosmetic treatment; medical evaluation priority"],
        "homeRemedies": [
            "Address underlying disease (lung, heart, liver)",
            "Manage inflammation and circulation"
        ],
        "timeFrame": "Depends on managing underlying cause",
        "associatedDiseases": "Lung cancer, cystic fibrosis, heart disease, liver disease, IBD"
    },
    "muehrcke's lines": {
        "recommendedCosmetics": ["None specific"],
        "homeRemedies": ["Treat underlying cause like low albumin or liver disease"],
        "timeFrame": "Lines fade once condition improves; variable",
        "associatedDiseases": "Low albumin (liver/kidney disease, malnutrition, chemotherapy)"
    },
    "onycholysis": {
        "recommendedCosmetics": ["Avoid nail polish and irritants until healed"],
        "homeRemedies": [
            "Keep nails trimmed short",
            "Protect nails from trauma and moisture",
            "Treat fungal or other infections as needed"
        ],
        "timeFrame": "Nail regrowth takes 4-6 months",
        "associatedDiseases": "Thyroid disease, psoriasis, fungal infections, trauma, medication reactions"
    },
    "terry's nail": {
        "recommendedCosmetics": ["Moisturizers for nails and cuticles"],
        "homeRemedies": [
            "Manage underlying diseases",
            "Maintain balanced diet and hydration"
        ],
        "timeFrame": "Improvement with disease management; variable",
        "associatedDiseases": "Liver disease, chronic kidney failure, heart failure, diabetes, aging"
    },
    "white spots": {
        "recommendedCosmetics": ["Avoid nail polish overuse or harsh chemicals"],
        "homeRemedies": [
            "Protect nails from trauma (e.g. manicures)",
            "Maintain balanced diet for mineral/vitamin intake"
        ],
        "timeFrame": "Spots grow out with nail, weeks to months",
        "associatedDiseases": "Nail injury, fungal infection, mineral deficiency, allergic reaction"
    },
    "anemic": {
        "recommendedCosmetics": ["Nail-strengthening and moisturizing products"],
        "homeRemedies": [
            "Iron-rich diet, iron supplements after medical advice",
            "Treat root anemia cause"
        ],
        "timeFrame": "Weeks to months with consistent treatment",
        "associatedDiseases": "Iron deficiency anemia, chronic illness causing anemia"
    }
}

# Load TFLite model
interpreter = tf.lite.Interpreter(model_path=model_path)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def predict(img_path):
    # Load and preprocess image
    img = image.load_img(img_path, target_size=(224, 224))  # adjust to model input size
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0).astype(np.float32) / 255.0

    # Set input tensor
    interpreter.set_tensor(input_details[0]['index'], img_array)

    # Run inference
    interpreter.invoke()

    # Get predictions
    predictions = interpreter.get_tensor(output_details[0]['index'])[0]
    predicted_class = int(np.argmax(predictions))
    confidence = float(np.max(predictions))

    disease = labels[predicted_class]
    rec = recommendations.get(disease, {})

    return {
        "class": disease,
        "confidence": round(confidence * 100, 2),
        "recommendations": rec
    }

if __name__ == "__main__":
    img_path = sys.argv[1]
    try:
        result = predict(img_path)
        print(json.dumps(result))   # 👈 only JSON
    except Exception as e:
        print("++++++++++++++++++++++++++++++++++++",json.dumps({"error": str(e)})) 
        print("the error ",e)
        
