# Inspection Report Form - Auto-Save Implementation

## Overview
This implementation adds real-time auto-save functionality to the Thermal Inspection Report Form. Users can now fill out the form at their own pace, and all data is automatically persisted to the backend. If they close the form and reopen it later, all previously entered data is restored.

## Features Implemented

### 1. **Real-Time Auto-Save**
- Form data is automatically saved to the backend every 2 seconds after the user stops typing
- Uses debouncing to prevent excessive API calls
- Silent auto-save doesn't interrupt the user experience

### 2. **Data Persistence**
- All form fields are persisted in a dedicated database table
- Data survives page refreshes, browser closures, and interruptions
- Unique constraint ensures one form per inspection

### 3. **Form State Management**
- Loads saved data automatically when form opens
- Tracks finalization status
- Maintains audit trail with timestamps

## Architecture

### Backend Components

#### 1. **Entity: `InspectionReportForm.java`**
Location: `backend/src/main/java/com/example/transformerthermalinspector/dao/`

Stores all form data fields:
- Basic information (date, time, inspector)
- Baseline imaging values
- Last/current month data
- Meter details
- Work content (JSON)
- Inspection report data (JSON)
- First & second inspection voltage/current readings
- Metadata (created, updated, finalized timestamps)

#### 2. **DTO: `InspectionReportFormDTO.java`**
Location: `backend/src/main/java/com/example/transformerthermalinspector/dto/`

Data transfer object for client-server communication.

#### 3. **Repository: `InspectionReportFormRepository.java`**
Location: `backend/src/main/java/com/example/transformerthermalinspector/repository/`

JPA repository with custom queries:
- `findByInspectionNo(Long)` - Get form by inspection number
- `existsByInspectionNo(Long)` - Check if form exists
- `deleteByInspectionNo(Long)` - Delete form

#### 4. **Service: `InspectionReportFormService.java`**
Location: `backend/src/main/java/com/example/transformerthermalinspector/service/`

Business logic for:
- Auto-save (upsert operation)
- Retrieval
- Finalization
- Deletion

#### 5. **Controller: `InspectionReportFormController.java`**
Location: `backend/src/main/java/com/example/transformerthermalinspector/controller/`

REST endpoints:
- `POST /api/inspection-report-forms/{inspectionNo}/auto-save` - Auto-save data
- `GET /api/inspection-report-forms/{inspectionNo}` - Get saved data
- `POST /api/inspection-report-forms/{inspectionNo}/finalize` - Finalize report
- `DELETE /api/inspection-report-forms/{inspectionNo}` - Delete form

#### 6. **Database Migration: `create_inspection_report_form_table.sql`**
Location: `database/migrations/`

Creates the `inspection_report_form` table with:
- All form fields as columns
- Foreign key to inspection table
- Indexes for performance
- Cascade delete constraint

### Frontend Components

#### Updated: `ThermalInspectionForm.jsx`
Location: `frontend/src/pages/`

**New State Fields:**
- Added voltage/current reading fields (first & second inspection)

**New Functions:**
- `fetchSavedFormData()` - Loads saved data on mount
- `autoSaveFormData()` - Debounced auto-save function
- Updated `handleSave()` - Finalizes report in backend

**New Effects:**
- Load saved data on component mount
- Auto-save with 2-second debounce on form changes

**Updated Input Fields:**
- All Section 7 inputs now have `value` and `onChange` handlers
- Proper field name mapping for voltage/current readings

## Database Schema

```sql
CREATE TABLE inspection_report_form (
    id BIGSERIAL PRIMARY KEY,
    inspection_no BIGINT NOT NULL UNIQUE,
    
    -- Section 1: Basic Information
    date_of_inspection VARCHAR(255),
    time_of_inspection VARCHAR(255),
    inspected_by VARCHAR(255),
    
    -- Section 2: Base Line Imaging nos (IR)
    baseline_imaging_right VARCHAR(255),
    baseline_imaging_left VARCHAR(255),
    baseline_imaging_front VARCHAR(255),
    
    -- Section 3: Last Month
    last_month_kva VARCHAR(255),
    last_month_date VARCHAR(255),
    last_month_time VARCHAR(255),
    
    -- Section 4: Current Month
    current_month_kva VARCHAR(255),
    baseline_condition VARCHAR(255),
    transformer_type VARCHAR(255),
    
    -- Section 5: Meter Details
    meter_serial_number VARCHAR(255),
    meter_ct_ratio VARCHAR(255),
    meter_make VARCHAR(255),
    
    -- Section 6: Work Content & Inspection Report (JSON)
    work_content TEXT,
    inspection_report TEXT,
    after_thermal_date VARCHAR(255),
    after_thermal_time VARCHAR(255),
    
    -- Section 7: First Inspection Readings
    first_inspection_v_r VARCHAR(255),
    first_inspection_v_y VARCHAR(255),
    first_inspection_v_b VARCHAR(255),
    first_inspection_i_r VARCHAR(255),
    first_inspection_i_y VARCHAR(255),
    first_inspection_i_b VARCHAR(255),
    
    -- Section 7: Second Inspection Readings
    second_inspection_v_r VARCHAR(255),
    second_inspection_v_y VARCHAR(255),
    second_inspection_v_b VARCHAR(255),
    second_inspection_i_r VARCHAR(255),
    second_inspection_i_y VARCHAR(255),
    second_inspection_i_b VARCHAR(255),
    
    -- Metadata
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP,
    
    CONSTRAINT fk_inspection_report_form_inspection
        FOREIGN KEY (inspection_no)
        REFERENCES inspection(inspection_no)
        ON DELETE CASCADE
);
```

## Setup Instructions

### 1. Run Database Migration

Connect to your PostgreSQL database and run:

```bash
psql -U your_username -d your_database -f database/migrations/create_inspection_report_form_table.sql
```

Or execute the SQL directly in your database client.

### 2. Rebuild Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 3. Restart Frontend

```bash
cd frontend
npm run dev
```

## API Endpoints

### Auto-Save Form Data
```http
POST /api/inspection-report-forms/{inspectionNo}/auto-save
Content-Type: application/json

{
  "dateOfInspection": "2024-11-27",
  "timeOfInspection": "14:30",
  "inspectedBy": "INS001",
  "baselineImagingRight": "123",
  "baselineImagingLeft": "124",
  "baselineImagingFront": "125",
  "lastMonthKVA": "100",
  "lastMonthDate": "2024-10-27",
  "lastMonthTime": "10:00",
  "currentMonthKVA": "105",
  "baselineCondition": "Sunny",
  "transformerType": "Distribution",
  "meterSerialNumber": "MTR12345",
  "meterCTRatio": "100",
  "meterMake": "Siemens",
  "workContent": "[{\"c\":true,\"ci\":true,\"t\":true,\"r\":false,\"other\":\"\"}]",
  "inspectionReport": "[{\"ok\":true,\"notOk\":false,\"irNo\":\"\"}]",
  "firstInspectionVR": "230",
  "firstInspectionVY": "231",
  "firstInspectionVB": "229",
  "firstInspectionIR": "10.5",
  "firstInspectionIY": "10.3",
  "firstInspectionIB": "10.4",
  "secondInspectionVR": "232",
  "secondInspectionVY": "230",
  "secondInspectionVB": "231",
  "secondInspectionIR": "10.6",
  "secondInspectionIY": "10.4",
  "secondInspectionIB": "10.5"
}
```

Response: `200 OK` with saved form data

### Get Saved Form Data
```http
GET /api/inspection-report-forms/{inspectionNo}
```

Response: `200 OK` with form data, or `404 Not Found` if no data exists

### Finalize Report
```http
POST /api/inspection-report-forms/{inspectionNo}/finalize
Content-Type: application/json

{
  // Same body as auto-save
}
```

Response: `200 OK` with finalized form data (isFinalized=true, finalizedAt timestamp set)

### Delete Form Data
```http
DELETE /api/inspection-report-forms/{inspectionNo}
```

Response: `200 OK` with success message

## User Experience Flow

1. **User Opens Form**
   - Frontend loads inspection data
   - Checks for existing saved form data
   - If found, populates all fields with saved values
   - If not found, shows empty form with defaults

2. **User Fills Form**
   - User types in any field
   - After 2 seconds of inactivity, data auto-saves to backend
   - Auto-save is silent (no alerts or notifications)
   - User can close browser anytime

3. **User Returns Later**
   - Opens the same inspection form
   - All previously entered data is restored
   - User can continue where they left off

4. **User Finalizes Report**
   - Clicks "Save" button
   - Final save with finalization flag
   - Generates timestamp for completion
   - Form marked as complete

## Testing

### Test Auto-Save
1. Open an inspection form
2. Fill in some fields
3. Wait 3-4 seconds
4. Check browser console: should see "Form auto-saved successfully"
5. Refresh the page
6. Verify all entered data is still there

### Test Finalization
1. Fill out the complete form
2. Click "Save" button
3. Should see "Form saved and finalized successfully!" alert
4. Check database: `is_finalized` should be `true`

### Test Database
```sql
-- Check saved forms
SELECT * FROM inspection_report_form;

-- Check specific form
SELECT * FROM inspection_report_form WHERE inspection_no = 1;

-- Check finalized forms
SELECT * FROM inspection_report_form WHERE is_finalized = true;
```

## Benefits

✅ **Data Safety** - No data loss from accidental closures
✅ **User Convenience** - Work at your own pace, resume anytime
✅ **Performance** - Debounced auto-save prevents server overload
✅ **Audit Trail** - Track when forms are created, updated, and finalized
✅ **Clean Architecture** - Separation of concerns with proper layering

## Future Enhancements

- Add visual indicator for auto-save status ("Saving...", "Saved", "Error")
- Add offline support with local storage fallback
- Add conflict resolution for multi-user editing
- Add form versioning/history
- Add partial validation on auto-save
- Add manual "Save Draft" button for explicit saves

## Troubleshooting

### Auto-save not working
- Check browser console for errors
- Verify backend is running on port 8080
- Check network tab for failed API calls
- Verify database connection

### Data not loading
- Check if inspection exists in database
- Verify foreign key constraint
- Check browser console for 404 errors

### Database errors
- Ensure migration script has been run
- Check foreign key references
- Verify table structure matches entity

## Notes

- Auto-save uses **upsert** logic (creates if new, updates if exists)
- JSON fields (workContent, inspectionReport) are stringified before save
- All timestamps are in server timezone
- Cascade delete: deleting inspection deletes associated form
- Unique constraint: one form per inspection only

---

**Implementation Date:** November 27, 2025
**Branch:** back_dev_ph4_u
**Status:** ✅ Complete and tested
