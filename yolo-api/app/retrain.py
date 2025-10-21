from ultralytics import YOLO
import os, datetime

DATA_YAML = 'dataset/data.yaml'
CURRENT_MODEL = 'models/best.pt'
TRAIN_DIR = 'models/retrain_logs'

def retrain_model():

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    run_name = f'retrain_{timestamp}'

    model = YOLO(CURRENT_MODEL)
    model.train(
        data=DATA_YAML,
        epochs=20,
        batch=16,
        imgsz=640,
        name=run_name,
        project=TRAIN_DIR,
    )

    new_weights = os.path.join(TRAIN_DIR, run_name, "weights", "best.pt")
    if os.path.exists(new_weights):
        os.replace(new_weights, CURRENT_MODEL)
        print(f"Model retrained successfully. New weights saved to {CURRENT_MODEL}")
    
    else:
        print("Retraining failed. New weights not found.")