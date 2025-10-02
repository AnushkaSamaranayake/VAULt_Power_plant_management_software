from fastapi import FastAPI, UploadFile, File, Query
from app.inference import run_inference

app = FastAPI(title = "YOLOv8 Thermal Anomaly Detection API")

@app.get("/")
def root():
    return {"message": "Welcome to the YOLOv8 Thermal Anomaly Detection API"}

@app.post("/inference")
async def inference(
    file: UploadFile = File(...),
    conf_threshold: float = Query(0.25, description="Confidence threshold for predictions")
):
    
    #Readfile

    image_bytes = await file.read()

    #Run inference
    predictions = run_inference(image_bytes, conf_threshold)

    return {"predictions": predictions}