import sys
import numpy as np
import tensorflow as tf
from PIL import Image

MODEL_PATH = "python/models/cosmetic/cosmetic_Model.tflite"

# Conditions
conditions = [
    "acne",
    "darkspots",
    "pores",
    "blackheads",
    "eyebags",
    "redness",
    "wrinkles"
]

# Skin types
skin_types = ["oily", "dry", "normal"]

# Remedies for each condition
remedies = {
    "acne": "Wash your face twice daily, use salicylic acid cleanser, avoid oily food.",
    "darkspots": "Use vitamin C serum, sunscreen daily, and hydrate well.",
    "pores": "Use niacinamide, clay masks, avoid heavy makeup.",
    "blackheads": "Exfoliate with BHA, use charcoal mask, avoid touching face.",
    "eyebags": "Sleep well, use cold compress, reduce salt intake.",
    "redness": "Use aloe vera gel, avoid spicy food, try green tea masks.",
    "wrinkles": "Moisturize regularly, use retinol, apply sunscreen daily."
}

# Load TFLite model
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def predict(image_path, skin_type):
    if skin_type not in skin_types:
        return {"error": f"Invalid skin type. Choose from {skin_types}"}

    # Preprocess image
    img = Image.open(image_path).convert("RGB").resize((224, 224))
    img_array = np.expand_dims(np.array(img, dtype=np.float32) / 255.0, axis=0)

    # Run inference
    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()

    predictions = interpreter.get_tensor(output_details[0]['index'])[0]
    class_index = np.argmax(predictions)
    confidence = float(np.max(predictions))

    # Reduce confidence by 20%
    confidence = max(confidence - 0.20, 0.0)

    condition = conditions[class_index]
    remedy = remedies.get(condition, "No remedy available.")

    return {
        "skin_type": skin_type,
        "condition": condition,
        "confidence": confidence,
        "remedy": remedy
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print({"error": "Usage: python predict_cosmetic.py <image_path> <skin_type>"})
        sys.exit(1)

    image_path = sys.argv[1]
    skin_type = sys.argv[2].lower()
    result = predict(image_path, skin_type)
    print(result)
