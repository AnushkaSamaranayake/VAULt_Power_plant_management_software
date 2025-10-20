# Detection Logs Generator

This script generates detection metadata logs for thermal anomaly analysis, suitable for project submission.

## Purpose

Processes at least 5 thermal images through the YOLO AI model and generates comprehensive detection metadata including:
- Bounding box pixel coordinates
- Anomaly dimensions (width, height, area)
- Confidence scores and severity levels
- Timestamps and classification details

## Prerequisites

1. **YOLO API Running**
   ```bash
   cd yolo-api
   uvicorn app.main:app --reload
   ```

2. **Thermal Images Available**
   - Images should be in `backend/uploads/maintenance/`
   - At least 5 images recommended (script will process first 5)

3. **Python Dependencies**
   ```bash
   pip install requests
   ```

## Usage

### Step 1: Start YOLO API (Terminal 1)
```bash
cd /home/lahiru/repos/VAULt_Power_plant_management_software/yolo-api
uvicorn app.main:app --reload
```

Wait for: `Application startup complete. Uvicorn running on http://127.0.0.1:5000`

### Step 2: Run the Script (Terminal 2)
```bash
cd /home/lahiru/repos/VAULt_Power_plant_management_software
python3 scripts/generate_detection_logs.py
```

## Output Files

The script generates two files in the project root:

### 1. `detection_logs_report.json`
Structured JSON format with:
- Report metadata (timestamp, totals)
- Model information (name, thresholds, mappings)
- Detailed results for each image:
  - Image identification
  - Detection count
  - Per-detection metadata:
    - Error number
    - Class ID and name (Faulty/Normal/Potentially Faulty)
    - Severity level (Critical/Warning/Normal)
    - Confidence score (decimal and percentage)
    - Bounding box coordinates (x1, y1, x2, y2)
    - Top-left, bottom-right, and center points
    - Dimensions (width, height, area in pixels)

### 2. `detection_logs_report.txt`
Human-readable text format with:
- Header with report details
- Per-image analysis sections
- Formatted detection details with visual indicators
- Summary statistics

## Example Output Structure

```
================================================================================
AI THERMAL ANOMALY DETECTION - METADATA REPORT
================================================================================
Generated: 2025-10-05 14:30:45
Model: YOLOv8 Custom Trained
Confidence Threshold: 0.5
Total Images Analyzed: 5
Total Detections: 12
================================================================================

================================================================================
IMAGE 1: INS-1_maintenance_06c87c30-d205-4b99-bf66-b05fd64935f0.jpg
================================================================================
Path: backend/uploads/maintenance/INS-1_maintenance_06c87c30...
Analysis Time: 2025-10-05T14:30:45.123456
Total Detections: 3
--------------------------------------------------------------------------------

  🔴 ERROR #1
  Class: Faulty (ID: 0)
  Severity: Critical
  Confidence: 87.45% (0.8745)
  
  Bounding Box Coordinates:
    - Top-Left: (245.32, 189.67)
    - Bottom-Right: (398.21, 312.45)
    - Center: (321.77, 251.06)
  
  Anomaly Dimensions:
    - Width: 152.89 pixels
    - Height: 122.78 pixels
    - Area: 18769.32 square pixels
  ----------------------------------------------------------------------------

  [... more detections ...]
```

## Troubleshooting

### Error: "YOLO API is not accessible"
**Solution**: Make sure YOLO API is running on http://localhost:5000
```bash
cd yolo-api
uvicorn app.main:app --reload
```

### Error: "No images found"
**Solution**: Ensure thermal images are in the correct folder
```bash
ls backend/uploads/maintenance/*.jpg
```

### Error: "Only X images available (need 5)"
**Solution**: Script will process available images. Add more images to reach 5:
- Use existing maintenance images from other inspections
- Ensure images are in `.jpg` format

## Submission

Include both generated files in your project submission:
1. `detection_logs_report.json` - For automated processing
2. `detection_logs_report.txt` - For human review

These files demonstrate that your AI detection system successfully processes thermal images and generates accurate metadata for identified anomalies.

## Configuration

You can modify these parameters in the script:

```python
YOLO_API_URL = "http://localhost:5000/inference"  # YOLO API endpoint
CONFIDENCE_THRESHOLD = 0.5                        # Minimum confidence
IMAGE_FOLDER = Path("backend/uploads/maintenance") # Image location
OUTPUT_JSON = "detection_logs_report.json"        # JSON output file
OUTPUT_TXT = "detection_logs_report.txt"          # Text output file
```

## Class Mappings

- **Class 0**: Faulty (Critical) 🔴
- **Class 1**: Normal 🟢
- **Class 2**: Potentially Faulty (Warning) 🟡
