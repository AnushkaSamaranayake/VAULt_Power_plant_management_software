# System Architecture Diagram

## AI Thermal Analysis Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                    (React Frontend - Port 5173)                     │
│                                                                     │
│  ┌──────────────────┐         ┌───────────────────────────────┐  │
│  │  Inspection Page │────────▶│  Upload Maintenance Image     │  │
│  └──────────────────┘         │  + Select Weather             │  │
│                                │  + Click Upload               │  │
│                                └───────────────────────────────┘  │
│                                         │                          │
└─────────────────────────────────────────┼──────────────────────────┘
                                          │ HTTP POST (multipart/form-data)
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT BACKEND                              │
│                         (Port 8080)                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              InspectionController                            │  │
│  │  @PostMapping("/{id}/maintenance-image")                    │  │
│  └────────────────────┬────────────────────────────────────────┘  │
│                       │                                             │
│                       ▼                                             │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              InspectionService                               │  │
│  │  1. Save image to filesystem                                │  │
│  │  2. Set aiAnalysisStatus = "pending"                        │  │
│  │  3. Save to database                                        │  │
│  │  4. Return success immediately ◀──┐                         │  │
│  │  5. Start async thread ────────────┼─────────┐              │  │
│  └─────────────────────────────────────────────┼───────────────┘  │
│                                                 │                   │
│                                                 ▼                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │         YoloAiService (Async Thread)                        │  │
│  │  analyzeImageAsync()                                        │  │
│  └────────────────────┬────────────────────────────────────────┘  │
│                       │                                             │
└───────────────────────┼─────────────────────────────────────────────┘
                        │ HTTP POST /inference
                        │ (image + confidence threshold)
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    YOLO FASTAPI SERVICE                             │
│                         (Port 5000)                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  @app.post("/inference")                                    │  │
│  │  1. Receive image                                           │  │
│  │  2. Load YOLO model (models/best.pt)                       │  │
│  │  3. Run inference on image                                  │  │
│  │  4. Detect thermal anomalies                                │  │
│  │  5. Generate bounding boxes                                 │  │
│  │  6. Return predictions as JSON                              │  │
│  └────────────────────┬────────────────────────────────────────┘  │
│                       │                                             │
└───────────────────────┼─────────────────────────────────────────────┘
                        │ Response: JSON predictions
                        │ {predictions: [{class, confidence, box}]}
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SPRING BOOT BACKEND (Async Thread)                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  YoloAiService - Process Response                           │  │
│  │  1. Receive predictions JSON                                │  │
│  │  2. Update inspection in database:                          │  │
│  │     - aiBoundingBoxes = JSON string                         │  │
│  │     - aiAnalysisStatus = "completed"                        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ Database Update
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                              │
│                         (Port 5432)                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Table: inspection                                          │  │
│  │  ┌──────────────────┬──────────────────────────────────┐   │  │
│  │  │ inspection_no    │ 123                              │   │  │
│  │  │ maintenance_img  │ INS-123_maintenance_uuid.png     │   │  │
│  │  │ ai_analysis_stat │ "completed"                      │   │  │
│  │  │ ai_bounding_box  │ {"predictions":[{class:0,...}]}  │   │  │
│  │  └──────────────────┴──────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ User clicks Refresh / Page reloads
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│              REACT FRONTEND - Fetch Updated Data                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  GET /api/inspections/{id}                                  │  │
│  └────────────────────┬────────────────────────────────────────┘  │
│                       │                                             │
│                       ▼                                             │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  AiAnalysisDisplay Component                                │  │
│  │  1. Parse ai_bounding_boxes JSON                            │  │
│  │  2. Load thermal image                                      │  │
│  │  3. Draw bounding boxes on Canvas                           │  │
│  │  4. Color-code by class:                                    │  │
│  │     - Red (Faulty)                                          │  │
│  │     - Green (Normal)                                        │  │
│  │     - Orange (Potentially Faulty)                           │  │
│  │  5. Display detection details                               │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


## Timeline Flow

```
Time    User Action          Backend                YOLO API           Database          Frontend Display
─────   ──────────────────   ────────────────────   ─────────────────  ──────────────────  ─────────────────
t=0s    Upload image         Receive image          -                  -                   Upload button
        ↓                    ↓                                                              
t=0.5s  -                    Save to filesystem     -                  -                   Uploading... 
                             ↓                                                               
t=0.8s  -                    Set status="pending"   -                  INSERT status       -
                             Save to DB             -                  ↓                    
                             ↓                                         Saved                
t=1s    -                    Return success ✓       -                  -                   Success! ✓
                             Start async thread ─→                                          Status: Analyzing...
                             ↓                                                              (pulsing animation)
t=1.5s  -                    Send image to YOLO ─→  Receive image     -                   -
                             ↓                      Load model                              
                                                    Run inference                           
t=3s    -                    Waiting...             Processing...      -                   Still analyzing...
                                                    ↓                                       
t=4s    -                    ←─ Receive results     Return JSON        -                   -
                             Parse predictions      predictions        
                             ↓                                         
t=4.5s  -                    Update database ────→  -                  UPDATE:             -
                             (ai_bounding_boxes)                       ai_bounding_boxes   
                             (status="completed")                      status="completed"  
                             ↓                                         ↓                    
t=5s    Click Refresh ────→  GET /inspections/123   -                  SELECT * ...        Fetch updated data
                             ↓                                         ↓                   ↓
t=5.5s  -                    Return with AI data ←──                   Return data ───→    Parse JSON
                                                                                            Draw boxes ✓
                                                                                            Status: Complete ✓
                                                                                            Show detections
```

## Data Structure

### Request (Upload)
```http
POST /api/inspections/123/maintenance-image
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="image"; filename="thermal.jpg"
Content-Type: image/jpeg

[BINARY IMAGE DATA]
------WebKitFormBoundary
Content-Disposition: form-data; name="weather"

sunny
------WebKitFormBoundary--
```

### Response (Immediate)
```json
{
  "inspectionNo": 123,
  "branch": "Colombo",
  "transformerNo": "TR-001",
  "maintenanceImagePath": "INS-123_maintenance_abc123.jpg",
  "weather": "sunny",
  "aiAnalysisStatus": "pending",
  "aiBoundingBoxes": null,
  "dateOfInspectionAndTime": "2025-10-04T12:30:00"
}
```

### YOLO API Response
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

### Database After Analysis
```sql
inspection_no: 123
ai_analysis_status: "completed"
ai_bounding_boxes: '{"predictions":[{"class":0,"confidence":0.8146686553955078,"box":[298.35,149.05,340.72,234.00]},{"class":2,"confidence":0.6426326036453247,"box":[226.69,165.51,283.13,258.08]}]}'
```

### Frontend GET Response (After Refresh)
```json
{
  "inspectionNo": 123,
  "branch": "Colombo",
  "transformerNo": "TR-001",
  "maintenanceImagePath": "INS-123_maintenance_abc123.jpg",
  "weather": "sunny",
  "aiAnalysisStatus": "completed",
  "aiBoundingBoxes": "{\"predictions\":[...]}",
  "dateOfInspectionAndTime": "2025-10-04T12:30:00"
}
```

## Component Hierarchy

```
App
 └─ InspectionDetails (Page)
     ├─ Head (Inspection Header)
     ├─ ImageUpload (Upload Component)
     │   ├─ Upload Modal
     │   ├─ Progress Indicator
     │   └─ Current Image Display
     └─ AiAnalysisDisplay (NEW!)
         ├─ Status Badge
         │   ├─ Pending (Clock icon, pulsing)
         │   ├─ Completed (Check icon)
         │   └─ Failed (Alert icon)
         ├─ Image with Canvas Overlay
         │   └─ Bounding Boxes (drawn via Canvas API)
         ├─ Toggle Checkbox
         └─ Detection Details List
             └─ Each Detection
                 ├─ Class Name (colored)
                 └─ Confidence %
```

## File Structure

```
VAULt_Power_plant_management_software/
│
├── backend/
│   ├── src/main/java/com/example/transformerthermalinspector/
│   │   ├── controller/
│   │   │   └── InspectionController.java (handles upload endpoint)
│   │   ├── service/
│   │   │   ├── InspectionService.java (triggers AI analysis)
│   │   │   └── YoloAiService.java (NEW! communicates with YOLO)
│   │   ├── dao/
│   │   │   └── Inspection.java (entity with AI fields)
│   │   ├── dto/
│   │   │   └── InspectionDTO.java (DTO with AI fields)
│   │   └── config/
│   │       └── WebConfig.java (RestTemplate bean)
│   ├── uploads/
│   │   ├── baseline/
│   │   └── maintenance/ (thermal images stored here)
│   └── AI_INTEGRATION_README.md (NEW! documentation)
│
├── frontend/
│   └── src/
│       ├── components/
│       │   └── InspectionDetails/
│       │       ├── ImageUpload.jsx (existing upload component)
│       │       └── AiAnalysisDisplay.jsx (NEW! shows AI results)
│       └── pages/
│           └── InspectionDetails.jsx (main inspection page)
│
├── yolo-api/
│   ├── app/
│   │   ├── main.py (FastAPI endpoints)
│   │   └── inference.py (YOLO model inference)
│   ├── models/
│   │   └── best.pt (YOLO model weights)
│   └── requirements.txt
│
├── database/
│   └── migrations/
│       └── add_ai_analysis_columns.sql (NEW! migration script)
│
├── AI_FEATURE_IMPLEMENTATION_SUMMARY.md (NEW!)
└── TESTING_GUIDE.md (NEW!)
```
