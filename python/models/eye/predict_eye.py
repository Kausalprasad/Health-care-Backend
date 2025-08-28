# backend/python/models/eye/predict_eye.py
from keras.preprocessing import image
import numpy as np
from PIL import Image
import os
import tensorflow as tf
import sys
import json

# Suppress TF logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.get_logger().setLevel('ERROR')

# Load model once
model_path = os.path.join(os.path.dirname(__file__), "eye_Model.keras")
savedModel = tf.keras.models.load_model(model_path, compile=False)

# Class labels
class_labels = ['Cataract', 'Conjunctivitis', 'Eyelid', 'Normal', 'Uveitis']

def predict_eye(img_path):
    """Return prediction for eye image"""
    img = Image.open(img_path).resize((224, 224))
    test_image = image.img_to_array(img)
    test_image = test_image / 255.0
    test_image = np.expand_dims(test_image, axis=0)

    # Prediction
    result = savedModel.predict(test_image, verbose=0)[0]  # 1D array
    max_index = np.argmax(result)
    predicted_class = class_labels[max_index]
    confidence = float(result[max_index]) * 100  # percentage

    # ✅ Threshold check
    if confidence < 50:
        return {
            "predicted_class": "Normal",
            "confidence": round(confidence, 2),
            "description": "Your eye appears healthy with no visible abnormalities detected."
        }
    else:
        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 2),
            "description": f"{predicted_class} detected with {round(confidence,2)}% confidence."
        }

# CLI execution
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
    img_path = sys.argv[1]
    result = predict_eye(img_path)
    print(json.dumps(result))
