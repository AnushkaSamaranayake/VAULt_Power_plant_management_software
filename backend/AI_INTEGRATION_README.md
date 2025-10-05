# AI-Powered Thermal Image Analysis Integration

## Overview
This feature automatically analyzes maintenance thermal images using a YOLO-based AI model deployed as a FastAPI application. When a maintenance image is uploaded, it is automatically sent to the AI service for anomaly detection, and the bounding box coordinates are stored in the database.

## Architecture Flow

## Architecture Overview

```
Frontend (React) → Backend (Spring Boot) → Database (PostgreSQL)
                        ↓
FastAPI YOLO Service (http://localhost:5000)
```

## Database Schema Changes

### New Columns in `inspection` table:
- `ai_bounding_boxes` (TEXT): Stores JSON array of bounding box predictions from YOLO
- `ai_analysis_status` (VARCHAR): Status of AI analysis - "pending", "completed", "failed"

Example JSON structure for `ai_bounding_boxes`:
```json
{
  "predictions": [
    {
      "class": 0,
      "confidence": 0.8146686553955078,
      "box": [298.35, 149.05, 340.72, 234.00]
    },
    {
      "class": 2,
      "confidence": 0.6426326036453247,
      "box": [226.69, 165.51, 283.13, 258.08]
    }
  ]
}
```

Class mapping: 
- 0 = Faulty
- 1 = Normal
- 2 = Potentially Faulty

## API Endpoints

### Upload Maintenance Image (triggers AI analysis)
```http
POST /api/inspections/{inspectionNo}/maintenance-image
Content-Type: multipart/form-data

Parameters:
- image: file (required)
- weather: string (optional)

Response:
{
  "inspectionNo": 1,
  "maintenanceImagePath": "INS-1_maintenance_uuid.png",
  "aiAnalysisStatus": "pending",
  "aiBoundingBoxes": null,
  ...
}
```

### Get Inspection with AI Results
```http
GET /api/inspections/{inspectionNo}

Response:
{
  "inspectionNo": 1,
  "maintenanceImagePath": "INS-1_maintenance_uuid.png",
  "aiAnalysisStatus": "completed",
  "aiBoundingBoxes": "{\"predictions\":[...]}",
  ...
}
```

## Setup Instructions


### 1. Start YOLO FastAPI Service
```bash
cd yolo-api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

2. **Verify YOLO API is running:**
```bash
curl http://localhost:5000/
```

### 3. Verify YOLO API
```bash
curl http://localhost:8000/
# Should return: {"message": "Welcome to the YOLOv8 Thermal Anomaly Detection API"}
```

### 5. Start Spring Boot Backend
```bash
cd backend
./mvnw spring-boot:run
```

## Configuration

### YOLO API URL
Edit `YoloAiService.java`:
```java
private static final String YOLO_API_URL = "http://localhost:5000/inference";
```

### Confidence Threshold
Default: 0.50 (50%)
Modify in `YoloAiService.java`:
```java
private static final double DEFAULT_CONFIDENCE_THRESHOLD = 0.50;
```

## How It Works

1. **User uploads maintenance image** via frontend
2. **Backend saves image** to file system
3. **Backend sets AI status** to "pending" and saves to database
4. **Backend triggers async AI analysis** (doesn't block the response)
5. **Backend calls YOLO FastAPI** with the image
6. **YOLO returns predictions** with bounding boxes
7. **Backend saves results** to database (ai_bounding_boxes, status="completed")
8. **Frontend can poll** or fetch the inspection to get AI results

## Frontend Integration

### Fetch AI Analysis Results
```javascript
const response = await axios.get(`http://localhost:8080/api/inspections/${inspectionNo}`);
const inspection = response.data;

if (inspection.aiAnalysisStatus === 'completed' && inspection.aiBoundingBoxes) {
  const aiResults = JSON.parse(inspection.aiBoundingBoxes);
  // Draw bounding boxes on image
  aiResults.predictions.forEach(pred => {
    const [x1, y1, x2, y2] = pred.box;
    const className = pred.class === 0 ? 'Faulty' : pred.class === 1 ? 'Normal' : 'Potentially Faulty';
    // Draw box at coordinates (x1, y1, x2, y2)
  });
}
```

## Error Handling

- **YOLO API unavailable**: Status will be set to "failed"
- **Invalid image format**: Analysis will fail, status set to "failed"
- **Network timeout**: Async thread handles gracefully, sets status to "failed"

## Testing

### Test AI Analysis Manually
```bash
curl -X POST "http://localhost:5000/inference?conf_threshold=0.50" \
  -F "file=@path/to/thermal/image.jpg"
```

### Test Full Flow
1. Upload a maintenance image via frontend
2. Check database: `SELECT ai_analysis_status, ai_bounding_boxes FROM inspection WHERE inspection_no = 1;`
3. Status should change from "pending" → "completed"
4. `ai_bounding_boxes` should contain JSON with predictions





