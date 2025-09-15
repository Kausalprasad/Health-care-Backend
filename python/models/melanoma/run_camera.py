import sys, cv2, torch, json
from final_camera_detector import FinalCameraDetector

if len(sys.argv) < 2:
    print(json.dumps({"error": "Video path required"}))
    sys.exit(1)

video_path = sys.argv[1]

# Initialize detector (model + transforms)
detector = FinalCameraDetector()

cap = cv2.VideoCapture(video_path)
predictions = []

while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pred_class, conf, _ = detector.predict(frame_rgb)
    predictions.append((pred_class, conf))

cap.release()

# Aggregate results
classes = [p[0] for p in predictions]
confidences = [p[1] for p in predictions]
most_common_class = max(set(classes), key=classes.count)
avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

result = {
    "prediction": detector.class_names[most_common_class],
    "confidence": avg_conf
}

print(json.dumps(result))
