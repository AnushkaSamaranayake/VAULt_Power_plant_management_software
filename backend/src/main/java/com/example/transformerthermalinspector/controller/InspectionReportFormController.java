package com.example.transformerthermalinspector.controller;

import com.example.transformerthermalinspector.dto.InspectionReportFormDTO;
import com.example.transformerthermalinspector.service.InspectionReportFormService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * REST controller for managing inspection report forms.
 * Provides endpoints for auto-save, retrieval, and finalization.
 */
@RestController
@RequestMapping("/api/inspection-report-forms")
@CrossOrigin(origins = "*")
public class InspectionReportFormController {

    private static final Logger logger = LoggerFactory.getLogger(InspectionReportFormController.class);

    @Autowired
    private InspectionReportFormService reportFormService;

    /**
     * Auto-save inspection report form data (real-time updates).
     * Creates new record if doesn't exist, updates if exists.
     * 
     * POST /api/inspection-report-forms/{inspectionNo}/auto-save
     */
    @PostMapping("/{inspectionNo}/auto-save")
    public ResponseEntity<?> autoSaveReportForm(
            @PathVariable Long inspectionNo,
            @RequestBody InspectionReportFormDTO dto) {
        
        logger.info("Auto-save request received for inspection: {}", inspectionNo);
        
        try {
            InspectionReportFormDTO savedForm = reportFormService.autoSave(inspectionNo, dto);
            return ResponseEntity.ok(savedForm);
        } catch (RuntimeException e) {
            logger.error("Error auto-saving report form for inspection {}: {}", inspectionNo, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Get inspection report form by inspection number.
     * 
     * GET /api/inspection-report-forms/{inspectionNo}
     */
    @GetMapping("/{inspectionNo}")
    public ResponseEntity<?> getReportForm(@PathVariable Long inspectionNo) {
        logger.info("Get report form request for inspection: {}", inspectionNo);
        
        Optional<InspectionReportFormDTO> reportForm = reportFormService.getByInspectionNo(inspectionNo);
        
        if (reportForm.isPresent()) {
            return ResponseEntity.ok(reportForm.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No report form found for inspection: " + inspectionNo);
        }
    }

    /**
     * Finalize inspection report (mark as complete and saved).
     * 
     * POST /api/inspection-report-forms/{inspectionNo}/finalize
     */
    @PostMapping("/{inspectionNo}/finalize")
    public ResponseEntity<?> finalizeReportForm(
            @PathVariable Long inspectionNo,
            @RequestBody InspectionReportFormDTO dto) {
        
        logger.info("Finalize report form request for inspection: {}", inspectionNo);
        
        try {
            InspectionReportFormDTO finalizedForm = reportFormService.finalizeReport(inspectionNo, dto);
            return ResponseEntity.ok(finalizedForm);
        } catch (RuntimeException e) {
            logger.error("Error finalizing report form for inspection {}: {}", inspectionNo, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Check if inspection report form is finalized (manually saved).
     * 
     * GET /api/inspection-report-forms/{inspectionNo}/status
     */
    @GetMapping("/{inspectionNo}/status")
    public ResponseEntity<?> getReportFormStatus(@PathVariable Long inspectionNo) {
        logger.info("Get report form status request for inspection: {}", inspectionNo);
        
        try {
            boolean isFinalized = reportFormService.isFormFinalized(inspectionNo);
            return ResponseEntity.ok(new FormStatusResponse(isFinalized));
        } catch (Exception e) {
            logger.error("Error checking report form status for inspection {}: {}", inspectionNo, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error checking form status: " + e.getMessage());
        }
    }

    /**
     * Delete inspection report form.
     * 
     * DELETE /api/inspection-report-forms/{inspectionNo}
     */
    @DeleteMapping("/{inspectionNo}")
    public ResponseEntity<?> deleteReportForm(@PathVariable Long inspectionNo) {
        logger.info("Delete report form request for inspection: {}", inspectionNo);
        
        try {
            reportFormService.deleteByInspectionNo(inspectionNo);
            return ResponseEntity.ok("Report form deleted successfully");
        } catch (Exception e) {
            logger.error("Error deleting report form for inspection {}: {}", inspectionNo, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting report form: " + e.getMessage());
        }
    }

    /**
     * Response class for form status
     */
    public static class FormStatusResponse {
        public boolean isFinalized;
        
        public FormStatusResponse(boolean isFinalized) {
            this.isFinalized = isFinalized;
        }
        
        public boolean isFinalized() {
            return isFinalized;
        }
    }
}
