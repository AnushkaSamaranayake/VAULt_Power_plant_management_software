package com.example.transformerthermalinspector.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for transferring inspection report form data between client and server.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InspectionReportFormDTO {

    private Long id;
    private Long inspectionNo;

    // Section 1: Basic Information
    private String dateOfInspection;
    private String timeOfInspection;
    private String inspectedBy;

    // Section 2: Base Line Imaging nos (IR)
    private String baselineImagingRight;
    private String baselineImagingLeft;
    private String baselineImagingFront;

    // Section 3: Last Month
    private String lastMonthKVA;
    private String lastMonthDate;
    private String lastMonthTime;

    // Section 4: Current Month
    private String currentMonthKVA;
    private String baselineCondition;
    private String transformerType;

    // Section 5: Meter Details
    private String meterSerialNumber;
    private String meterCTRatio;
    private String meterMake;

    // Section 6: Work Content (as JSON string)
    private String workContent;

    // Section 6: Inspection Report (as JSON string)
    private String inspectionReport;

    // Section 6: Auto-generated timestamps
    private String afterThermalDate;
    private String afterThermalTime;

    // Section 7: First Inspection Readings
    private String firstInspectionVR;
    private String firstInspectionVY;
    private String firstInspectionVB;
    private String firstInspectionIR;
    private String firstInspectionIY;
    private String firstInspectionIB;

    // Section 7: Second Inspection Readings
    private String secondInspectionVR;
    private String secondInspectionVY;
    private String secondInspectionVB;
    private String secondInspectionIR;
    private String secondInspectionIY;
    private String secondInspectionIB;

    // Metadata
    private Boolean isFinalized;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime finalizedAt;
}
