import os
import sys
import json
import numpy as np
from PIL import Image
from tensorflow.keras.models import load_model
import contextlib

# Import disease mapping function
from disease_mapping import LABEL_COLUMNS, diseases_from_raw_scores

# Suppress TensorFlow info/warning logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

MODEL_PATH = os.path.join(os.path.dirname(__file__), "tongue_disease_model.keras")

if not os.path.exists(MODEL_PATH):
    print(json.dumps({"error": f"Model file not found at {MODEL_PATH}"}))
    sys.exit(1)

# Load model without compilation for faster loading
model = load_model(MODEL_PATH, compile=False)

def predict(image_path):
    try:
        if not os.path.exists(image_path):
            return {"error": f"Image file not found: {image_path}"}

        # Load and preprocess image
        img = Image.open(image_path).convert("RGB").resize((224, 224))
        img_array = np.expand_dims(np.array(img) / 255.0, axis=0)

        # Suppress TF stdout/stderr logs during prediction
        with open(os.devnull, "w") as devnull, contextlib.redirect_stdout(devnull), contextlib.redirect_stderr(devnull):
            prediction = model.predict(img_array, verbose=0)

        # Convert NaN to zero if any
        prediction = np.nan_to_num(prediction, nan=0.0)

        # Prepare raw scores dictionary (label -> score)
        all_scores = {label: float(score) for label, score in zip(LABEL_COLUMNS, prediction[0])}

        # Filter only scores >= 0.7 (70%)
        raw_scores = {k: v for k, v in all_scores.items() if v >= 0.7}

        # Get diseases based on mapping rules, pass threshold 0.7 for consistency
        diseases = diseases_from_raw_scores(raw_scores, threshold=0.7)

        return {
            "raw_scores": raw_scores,
            "diseases": diseases
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python predictor.py <image_path>"}))
        sys.exit(1)

    image_path = sys.argv[1]
    result = predict(image_path)

    # Always print JSON string
    print(json.dumps(result))
