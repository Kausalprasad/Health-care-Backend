import os
import sys
import numpy as np
import tensorflow.lite as tflite
from PIL import Image
import json
import warnings

# 🔇 Suppress TensorFlow and deprecation warnings
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"   # disable oneDNN logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"    # 0 = all logs, 3 = only errors
warnings.filterwarnings("ignore", category=UserWarning)

# ✅ Base directory = the folder where this script lives
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ✅ Model and labels are in the same directory as this script
MODEL_PATH = os.path.join(BASE_DIR, "hair_Model.tflite")
LABELS_PATH = os.path.join(BASE_DIR, "labels.txt")

# Load labels
with open(LABELS_PATH, "r") as f:
    labels = [line.strip().split(" ", 1)[1] for line in f.readlines()]

# Load model
interpreter = tflite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def preprocess_image(image_path, input_shape):
    img = Image.open(image_path).convert("RGB")
    img = img.resize((input_shape[1], input_shape[2]))
    img = np.array(img, dtype=np.float32) / 255.0
    img = np.expand_dims(img, axis=0)
    return img

def predict(image_path):
    input_shape = input_details[0]["shape"]
    img = preprocess_image(image_path, input_shape)

    interpreter.set_tensor(input_details[0]["index"], img)
    interpreter.invoke()
    output_data = interpreter.get_tensor(output_details[0]["index"])

    predicted_index = int(np.argmax(output_data))
    confidence = float(np.max(output_data))

    return {
        "class": labels[predicted_index],
        "confidence": round(confidence, 4)
    }

if __name__ == "__main__":
    image_path = sys.argv[1]
    result = predict(image_path)
    # ✅ Always return clean JSON
    print(json.dumps(result))
