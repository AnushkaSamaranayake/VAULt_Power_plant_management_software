from  ultralytics import YOLO
import cv2 as cv
import numpy as np
import os
import threading
import time
import torch

MODEL_PATH = "models/best.pt"

# Determine best device for inference
if torch.cuda.is_available():
    print("Device for inference: CUDA")
    INFERENCE_DEVICE = '0'  # Use GPU for inference if available
else:
    INFERENCE_DEVICE = 'cpu'  # Fallback to CPU

#load the model
model = YOLO(MODEL_PATH)
model.to(INFERENCE_DEVICE)
last_modified_time = os.path.getmtime(MODEL_PATH)

def watch_model():
    global model, last_modified_time
    while True:
        modified = os.path.getmtime(MODEL_PATH)
        if modified != last_modified_time:
            print("Model weights updated. Reloading model...")
            model = YOLO(MODEL_PATH)
            model.to(INFERENCE_DEVICE)
            last_modified_time = modified
            print(f"Model reloaded on {INFERENCE_DEVICE}")
        time.sleep(60) # Check every 60 seconds

threading.Thread(target=watch_model, daemon=True).start()

def reload_model():
    global model,last_modified_time
    model = YOLO(MODEL_PATH)
    model.to(INFERENCE_DEVICE)
    last_modified_time = os.path.getmtime(MODEL_PATH)
    print(f"Model reloaded manually on {INFERENCE_DEVICE}")

#inference function
def run_inference(image_bytes: bytes, conf_threshold: float = 0.25):
    # Convert bytes data to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    # Decode numpy array to OpenCV image
    img = cv.imdecode(nparr, cv.IMREAD_COLOR)

    # Perform inference on best available device
    results = model(img, conf=conf_threshold, device=INFERENCE_DEVICE)

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