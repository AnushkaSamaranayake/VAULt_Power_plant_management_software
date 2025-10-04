# 🧪 Quick Testin### Alternative Test: Direct YOLO API Test

```bash
uvicorn app.main:app --reload --port 5000
```

3. **Verify it's running:**
```bash
curl http://localhost:5000/e - AI Thermal Analysis

## Prerequisites Checklist

- ✅ PostgreSQL database running (localhost:5432)
- ✅ Database migration applied (ai_bounding_boxes, ai_analysis_status columns added)
- ✅ YOLO FastAPI service running (localhost:5000)
- ✅ Spring Boot backend compiled successfully
- ✅ Frontend dependencies installed (npm install)

## Step-by-Step Testing

### 1️⃣ Start YOLO FastAPI Service

```bash
# Terminal 1
cd /home/lahiru/repos/VAULt_Power_plant_management_software/yolo-api
uvicorn app.main:app --reload --port 8000
```

**Verify it's running:**
```bash
curl http://localhost:8000/
# Expected: {"message":"Welcome to the YOLOv8 Thermal Anomaly Detection API"}
```

### 2️⃣ Start Spring Boot Backend

```bash
# Terminal 2 (or use the existing running instance)
cd /home/lahiru/repos/VAULt_Power_plant_management_software/backend
./mvnw spring-boot:run
```

**Verify it's running:**
- Look for: `Tomcat started on port 8080 (http)`
- Check: `http://localhost:8080/api/inspections`

### 3️⃣ Start React Frontend

```bash
# Terminal 3
cd /home/lahiru/repos/VAULt_Power_plant_management_software/frontend
npm run dev
```

**Verify it's running:**
- Look for: `Local: http://localhost:5173/`
- Open browser to `http://localhost:5173`

### 4️⃣ Test the AI Analysis Feature

#### A. Navigate to an Inspection
1. Go to `http://localhost:5173`
2. Click on "Transformers" or navigate to transformers list
3. Select a transformer
4. Go to one of its inspections (or create a new one)

#### B. Upload a Thermal Image
1. On the inspection page, find "Maintenance Image Upload" section
2. Click "Upload Maintenance Image" button
3. Select weather condition (e.g., "Sunny")
4. Choose a thermal image file from your computer
5. Click upload

#### C. Watch the AI Analysis
1. Image uploads immediately (< 1 second)
2. AI Analysis Status shows "Analyzing..." with pulsing animation
3. Wait 2-5 seconds (depending on image size)
4. Click the refresh button (↻) or reload the page
5. Status changes to "Analysis Complete" ✓

#### D. View the Results
1. Scroll down to "AI Thermal Analysis" section
2. See bounding boxes drawn on the thermal image
3. Each box is color-coded:
   - 🔴 **Red** = Faulty
   - 🟢 **Green** = Normal
   - 🟠 **Orange** = Potentially Faulty
4. View detection details below showing class and confidence
5. Toggle "Show Bounding Boxes" checkbox to hide/show boxes

### 5️⃣ Verify in Database

```bash
psql -U postgres -h localhost -d postgres
```

```sql
-- Check the latest inspection with AI analysis
SELECT 
    inspection_no,
    maintenance_image_path,
    ai_analysis_status,
    LEFT(ai_bounding_boxes, 100) as ai_results_preview
FROM inspection
WHERE ai_analysis_status IS NOT NULL
ORDER BY inspection_no DESC
LIMIT 5;
```

**Expected Results:**
- `ai_analysis_status` = "completed"
- `ai_bounding_boxes` contains JSON with predictions

### 6️⃣ Test Error Scenarios

#### A. YOLO API Down
1. Stop the YOLO FastAPI service (Ctrl+C in Terminal 1)
2. Upload a new maintenance image
3. Wait a moment
4. Refresh the page
5. Status should show "Analysis Failed" ❌

#### B. Invalid Image
1. Try uploading a non-image file
2. Should be rejected before reaching AI service

## 🔍 Debugging

### Check Backend Logs
```bash
# In Terminal 2 (Spring Boot), watch for:
"InspectionService - Starting AI analysis for inspection: X"
"InspectionService - AI analysis completed for inspection: X"
# Or errors:
"InspectionService - AI analysis failed for inspection: X"
```

### Check YOLO API Logs
```bash
# In Terminal 1 (FastAPI), watch for:
POST /inference?conf_threshold=0.50
Status: 200
```

### Check Frontend Console
```bash
# In browser DevTools (F12) → Console tab
# Look for any JavaScript errors
# Network tab should show successful API calls
```

### Manual API Test
```bash
# Test YOLO API directly with curl:
curl -X POST "http://localhost:5000/inference?conf_threshold=0.50" \
  -F "file=@/path/to/your/thermal/image.jpg"

# Should return JSON with predictions
```

## ✅ Success Criteria

- [ ] YOLO API responds to health check
- [ ] Backend starts without errors
- [ ] Frontend displays inspection page
- [ ] Image uploads successfully
- [ ] AI status shows "Analyzing..." immediately after upload
- [ ] AI status changes to "completed" after a few seconds
- [ ] Bounding boxes appear on the thermal image
- [ ] Detection details list shows anomalies with confidence scores
- [ ] Toggle checkbox hides/shows bounding boxes
- [ ] Database contains AI results in JSON format

## 🆘 Common Issues

### Issue: "Analysis Failed"
**Cause**: YOLO API not reachable
**Fix**: 
```bash
# Restart YOLO API
cd yolo-api
uvicorn app.main:app --reload --port 8000
```

### Issue: Stuck on "Analyzing..."
**Cause**: Backend can't reach YOLO API or analysis taking too long
**Fix**: 
1. Check YOLO API is running
2. Check backend logs for errors
3. Try refreshing the page

### Issue: No Bounding Boxes Showing
**Cause**: Canvas not rendering or no detections
**Fix**:
1. Check browser console for errors
2. Verify `ai_bounding_boxes` in database has data
3. Try toggling the checkbox off and on

### Issue: Database Connection Error
**Cause**: PostgreSQL not running or wrong credentials
**Fix**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials in backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=admin123
```

## 📊 Sample Test Data

If you need a sample thermal image for testing:
1. Use any infrared/thermal camera image
2. Supported formats: JPG, PNG, GIF
3. Recommended size: 640x640 pixels or larger
4. The YOLO model should detect thermal anomalies

## 🎯 Expected Performance

- **Image Upload**: < 1 second
- **AI Analysis**: 2-5 seconds
- **Total Time**: 3-6 seconds from upload to results
- **Database Update**: Near instant after AI completes

## 📸 Screenshots to Verify

Take screenshots of:
1. ✅ AI Status showing "Analyzing..."
2. ✅ AI Status showing "Analysis Complete"
3. ✅ Thermal image with bounding boxes drawn
4. ✅ Detection details list
5. ✅ Database query results

---

**Ready to Test!** Follow the steps above and verify each checkpoint. 🚀
