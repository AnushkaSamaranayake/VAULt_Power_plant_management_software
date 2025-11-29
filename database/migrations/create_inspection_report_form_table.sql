-- Migration script to create inspection_report_form table
-- This table stores all form data from the thermal inspection report form

CREATE TABLE IF NOT EXISTS inspection_report_form (
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
    
    -- Foreign key constraint
    CONSTRAINT fk_inspection_report_form_inspection
        FOREIGN KEY (inspection_no)
        REFERENCES inspection(inspection_no)
        ON DELETE CASCADE
);

-- Create index on inspection_no for faster lookups
CREATE INDEX IF NOT EXISTS idx_inspection_report_form_inspection_no 
    ON inspection_report_form(inspection_no);

-- Create index on is_finalized for filtering
CREATE INDEX IF NOT EXISTS idx_inspection_report_form_is_finalized 
    ON inspection_report_form(is_finalized);

-- Add comment to table
COMMENT ON TABLE inspection_report_form IS 'Stores thermal inspection report form data with auto-save capability';
