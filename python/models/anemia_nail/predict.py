# python/models/anemia_nail/predict.py
import numpy as np
from PIL import Image
import tensorflow as tf
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "nail_model.tflite")

interpreter = tf.lite.Interpreter(model_path=model_path)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def preprocess_image(img_path):
    img = Image.open(img_path).crop((450, 50, 600, 300)).resize((224, 224)).convert("RGB")
    img_array = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(img_array, axis=0)

def predict(img_path):
    img = preprocess_image(img_path)
    interpreter.set_tensor(input_details[0]['index'], img)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])[0][0]
    return {
        "is_anemic": bool(output >= 0.5),
        "confidence": round(float(output), 2)
    }
