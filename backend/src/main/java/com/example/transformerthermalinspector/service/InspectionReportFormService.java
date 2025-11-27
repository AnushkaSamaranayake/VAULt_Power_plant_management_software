package com.example.transformerthermalinspector.service;

import com.example.transformerthermalinspector.dao.InspectionReportForm;
import com.example.transformerthermalinspector.dto.InspectionReportFormDTO;
import com.example.transformerthermalinspector.repository.InspectionReportFormRepository;
import com.example.transformerthermalinspector.repository.InspectionRepository;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for managing inspection report form data.
 * Handles auto-save and final save operations.
 */
@Service
public class InspectionReportFormService {

    private static final Logger logger = LoggerFactory.getLogger(InspectionReportFormService.class);

    @Autowired
    private InspectionReportFormRepository reportFormRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private ModelMapper modelMapper;

    /**
     * Auto-save inspection report form data (upsert).
     * Creates new record if doesn't exist, updates if exists.
     */
    @Transactional
    public InspectionReportFormDTO autoSave(Long inspectionNo, InspectionReportFormDTO dto) {
        logger.info("Auto-saving inspection report form for inspection: {}", inspectionNo);

        // Verify inspection exists
        if (!inspectionRepository.existsById(inspectionNo)) {
            throw new RuntimeException("Inspection not found: " + inspectionNo);
        }

        InspectionReportForm reportForm;

        // Check if report form already exists
        Optional<InspectionReportForm> existingForm = reportFormRepository.findByInspectionNo(inspectionNo);
        
        if (existingForm.isPresent()) {
            // Update existing
            reportForm = existingForm.get();
            updateFormFields(reportForm, dto);
            logger.info("Updating existing report form for inspection: {}", inspectionNo);
        } else {
            // Create new
            reportForm = new InspectionReportForm();
            reportForm.setInspectionNo(inspectionNo);
            updateFormFields(reportForm, dto);
            logger.info("Creating new report form for inspection: {}", inspectionNo);
        }

        InspectionReportForm savedForm = reportFormRepository.save(reportForm);
        return convertToDTO(savedForm);
    }

    /**
     * Get inspection report form by inspection number.
     */
    public Optional<InspectionReportFormDTO> getByInspectionNo(Long inspectionNo) {
        logger.info("Fetching inspection report form for inspection: {}", inspectionNo);
        
        return reportFormRepository.findByInspectionNo(inspectionNo)
                .map(this::convertToDTO);
    }

    /**
     * Finalize the inspection report (mark as complete).
     */
    @Transactional
    public InspectionReportFormDTO finalizeReport(Long inspectionNo, InspectionReportFormDTO dto) {
        logger.info("Finalizing inspection report form for inspection: {}", inspectionNo);

        // Auto-save first
        InspectionReportFormDTO savedDTO = autoSave(inspectionNo, dto);

        // Then mark as finalized
        InspectionReportForm reportForm = reportFormRepository.findByInspectionNo(inspectionNo)
                .orElseThrow(() -> new RuntimeException("Report form not found"));

        reportForm.setIsFinalized(true);
        reportForm.setFinalizedAt(LocalDateTime.now());

        InspectionReportForm finalizedForm = reportFormRepository.save(reportForm);
        logger.info("Report form finalized for inspection: {}", inspectionNo);

        return convertToDTO(finalizedForm);
    }

    /**
     * Delete inspection report form.
     */
    @Transactional
    public void deleteByInspectionNo(Long inspectionNo) {
        logger.info("Deleting inspection report form for inspection: {}", inspectionNo);
        reportFormRepository.deleteByInspectionNo(inspectionNo);
    }

    /**
     * Update form fields from DTO to entity.
     */
    private void updateFormFields(InspectionReportForm form, InspectionReportFormDTO dto) {
        // Section 1: Basic Information
        form.setDateOfInspection(dto.getDateOfInspection());
        form.setTimeOfInspection(dto.getTimeOfInspection());
        form.setInspectedBy(dto.getInspectedBy());

        // Section 2: Base Line Imaging
        form.setBaselineImagingRight(dto.getBaselineImagingRight());
        form.setBaselineImagingLeft(dto.getBaselineImagingLeft());
        form.setBaselineImagingFront(dto.getBaselineImagingFront());

        // Section 3: Last Month
        form.setLastMonthKVA(dto.getLastMonthKVA());
        form.setLastMonthDate(dto.getLastMonthDate());
        form.setLastMonthTime(dto.getLastMonthTime());

        // Section 4: Current Month
        form.setCurrentMonthKVA(dto.getCurrentMonthKVA());
        form.setBaselineCondition(dto.getBaselineCondition());
        form.setTransformerType(dto.getTransformerType());

        // Section 5: Meter Details
        form.setMeterSerialNumber(dto.getMeterSerialNumber());
        form.setMeterCTRatio(dto.getMeterCTRatio());
        form.setMeterMake(dto.getMeterMake());

        // Section 6: Work Content & Inspection Report
        form.setWorkContent(dto.getWorkContent());
        form.setInspectionReport(dto.getInspectionReport());
        form.setAfterThermalDate(dto.getAfterThermalDate());
        form.setAfterThermalTime(dto.getAfterThermalTime());

        // Section 7: First Inspection Readings
        form.setFirstInspectionVR(dto.getFirstInspectionVR());
        form.setFirstInspectionVY(dto.getFirstInspectionVY());
        form.setFirstInspectionVB(dto.getFirstInspectionVB());
        form.setFirstInspectionIR(dto.getFirstInspectionIR());
        form.setFirstInspectionIY(dto.getFirstInspectionIY());
        form.setFirstInspectionIB(dto.getFirstInspectionIB());

        // Section 7: Second Inspection Readings
        form.setSecondInspectionVR(dto.getSecondInspectionVR());
        form.setSecondInspectionVY(dto.getSecondInspectionVY());
        form.setSecondInspectionVB(dto.getSecondInspectionVB());
        form.setSecondInspectionIR(dto.getSecondInspectionIR());
        form.setSecondInspectionIY(dto.getSecondInspectionIY());
        form.setSecondInspectionIB(dto.getSecondInspectionIB());
    }

    /**
     * Convert entity to DTO.
     */
    private InspectionReportFormDTO convertToDTO(InspectionReportForm form) {
        return modelMapper.map(form, InspectionReportFormDTO.class);
    }
}
