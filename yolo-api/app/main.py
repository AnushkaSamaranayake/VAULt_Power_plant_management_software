from fastapi import FastAPI, UploadFile, File, Query
from app.inference import run_inference

app = FastAPI(title = "YOLOv8 Thermal Anomaly Detection API")

'''
sample output:
{
    predictions: [
        {
            "class":0,
            "confidence":0.8146686553955078,
            "box":[298.35321044921875,149.055419921875,340.72637939453125,234.0054931640625]
        },
        {
            "class":2,
            "confidence":0.6426326036453247,
            "box":[226.6981201171875,165.5118408203125,283.137939453125,258.0894775390625]
        },
        {
            "class":2,
            "confidence":0.5387545824050903,
            "box":[191.20150756835938,162.95330810546875,281.90533447265625,259.2609558105469]
        }
    ]
}

class mapping: 0 - Faulty, 1- Normal, 2- Potentially Faulty
'''

@app.get("/")
def root():
    return {"message": "Welcome to the YOLOv8 Thermal Anomaly Detection API"}

@app.post("/inference")
#Sample API call: "http://localhost:5000/inference?conf_threshold=0.80"\ -F "file=@path_to_your_image.jpg"
#pass the threshold value between 0 and 1, default is 0.50 and pass the image file paht

async def inference(
    file: UploadFile = File(...),
    conf_threshold: float = Query(0.50, description="Confidence threshold for predictions")
):
    
    #Readfile

    image_bytes = await file.read()

    #Run inference
    predictions = run_inference(image_bytes, conf_threshold)

    return {"predictions": predictions}