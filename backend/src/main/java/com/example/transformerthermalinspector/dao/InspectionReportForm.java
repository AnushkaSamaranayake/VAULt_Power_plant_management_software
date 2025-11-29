package com.example.transformerthermalinspector.dao;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing the thermal inspection report form data.
 * This stores all the fields that users fill out in the inspection form.
 * Maps to the 'inspection_report_form' table in PostgreSQL database.
 */
@Entity
@Table(name = "inspection_report_form")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InspectionReportForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // Foreign key to inspection table - REQUIRED
    @Column(name = "inspection_no", nullable = false, unique = true)
    private Long inspectionNo;

    // Section 1: Basic Information
    @Column(name = "date_of_inspection")
    private String dateOfInspection;

    @Column(name = "time_of_inspection")
    private String timeOfInspection;

    @Column(name = "inspected_by")
    private String inspectedBy;

    // Section 2: Base Line Imaging nos (IR)
    @Column(name = "baseline_imaging_right")
    private String baselineImagingRight;

    @Column(name = "baseline_imaging_left")
    private String baselineImagingLeft;

    @Column(name = "baseline_imaging_front")
    private String baselineImagingFront;

    // Section 3: Last Month
    @Column(name = "last_month_kva")
    private String lastMonthKVA;

    @Column(name = "last_month_date")
    private String lastMonthDate;

    @Column(name = "last_month_time")
    private String lastMonthTime;

    // Section 4: Current Month
    @Column(name = "current_month_kva")
    private String currentMonthKVA;

    @Column(name = "baseline_condition")
    private String baselineCondition;

    @Column(name = "transformer_type")
    private String transformerType;

    // Section 5: Meter Details
    @Column(name = "meter_serial_number")
    private String meterSerialNumber;

    @Column(name = "meter_ct_ratio")
    private String meterCTRatio;

    @Column(name = "meter_make")
    private String meterMake;

    // Section 6: Work Content (stored as JSON array)
    @Column(name = "work_content", columnDefinition = "TEXT")
    private String workContent;

    // Section 6: Inspection Report (stored as JSON array)
    @Column(name = "inspection_report", columnDefinition = "TEXT")
    private String inspectionReport;

    // Section 6: Auto-generated timestamps
    @Column(name = "after_thermal_date")
    private String afterThermalDate;

    @Column(name = "after_thermal_time")
    private String afterThermalTime;

    // Section 7: First Inspection Readings
    @Column(name = "first_inspection_v_r")
    private String firstInspectionVR;

    @Column(name = "first_inspection_v_y")
    private String firstInspectionVY;

    @Column(name = "first_inspection_v_b")
    private String firstInspectionVB;

    @Column(name = "first_inspection_i_r")
    private String firstInspectionIR;

    @Column(name = "first_inspection_i_y")
    private String firstInspectionIY;

    @Column(name = "first_inspection_i_b")
    private String firstInspectionIB;

    // Section 7: Second Inspection Readings
    @Column(name = "second_inspection_v_r")
    private String secondInspectionVR;

    @Column(name = "second_inspection_v_y")
    private String secondInspectionVY;

    @Column(name = "second_inspection_v_b")
    private String secondInspectionVB;

    @Column(name = "second_inspection_i_r")
    private String secondInspectionIR;

    @Column(name = "second_inspection_i_y")
    private String secondInspectionIY;

    @Column(name = "second_inspection_i_b")
    private String secondInspectionIB;

    // Metadata
    @Column(name = "is_finalized", nullable = false)
    private Boolean isFinalized = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "finalized_at")
    private LocalDateTime finalizedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Relationship to Inspection
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_no", referencedColumnName = "inspection_no", insertable = false, updatable = false)
    private Inspection inspection;
}
