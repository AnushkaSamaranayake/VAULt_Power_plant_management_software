from  ultralytics import YOLO
import cv2 as cv
import numpy as np
import os

#load the model
model = YOLO("models/best.pt")
# Force CPU inference to avoid CUDA compatibility issues
model.to('cpu')

#inference function
def run_inference(image_bytes: bytes, conf_threshold: float = 0.25):
    # Convert bytes data to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    # Decode numpy array to OpenCV image
    img = cv.imdecode(nparr, cv.IMREAD_COLOR)

    # Perform inference on CPU
    results = model(img, conf=conf_threshold, device='cpu')

    predictions = []
    print(f"YOLOv8 Inference Results: {results[0].boxes.data}")

    for r in results[0].boxes.data.tolist():
        x1, y1, x2, y2, score, class_id = r
        predictions.append({
            "class": int(class_id),
            "confidence": float(score),
            "box": [float(x1), float(y1), float(x2), float(y2)]
        })

    return predictions