from fastapi import FastAPI, UploadFile, File, Query
from app.inference import run_inference

app = FastAPI(title = "YOLOv8 Thermal Anomaly Detection API")

@app.get("/")
def root():
    return {"message": "Welcome to the YOLOv8 Thermal Anomaly Detection API"}

@app.post("/inference")
#Sample API call: "http://localhost:8000/inference?conf_threshold=0.80"\ -F "file=@test\images\T9_faulty_001_jpg.rf.94b2e9d6b21a1109f1289da38e134c3f.jpg"
async def inference(
    file: UploadFile = File(...),
    conf_threshold: float = Query(0.10, description="Confidence threshold for predictions")
):
    
    #Readfile

    image_bytes = await file.read()

    #Run inference
    predictions = run_inference(image_bytes, conf_threshold)

    return {"predictions": predictions}