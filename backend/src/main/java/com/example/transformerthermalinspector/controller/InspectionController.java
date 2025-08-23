package com.example.transformerthermalinspector.controller;

import com.example.transformerthermalinspector.dto.InspectionDTO;
import com.example.transformerthermalinspector.service.InspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Inspection management.
 * Provides endpoints for CRUD operations on inspections.
 */
@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow cross-origin requests for frontend integration
public class InspectionController {

    private final InspectionService inspectionService;

    /**
     * Create a new inspection
     * POST /api/inspections
     */
    @PostMapping
    public ResponseEntity<InspectionDTO> createInspection(@Valid @RequestBody InspectionDTO inspectionDTO) {
        try {
            // Set inspection timestamp if not provided
            if (inspectionDTO.getDateOfInspectionAndTime() == null) {
                inspectionDTO.setDateOfInspectionAndTime(LocalDateTime.now());
            }
            
            InspectionDTO savedInspection = inspectionService.saveInspection(inspectionDTO);
            return new ResponseEntity<>(savedInspection, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all inspections
     * GET /api/inspections
     */
    @GetMapping
    public ResponseEntity<List<InspectionDTO>> getAllInspections() {
        try {
            List<InspectionDTO> inspections = inspectionService.getAllInspections();
            if (inspections.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return new ResponseEntity<>(inspections, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get inspection by inspection number
     * GET /api/inspections/{inspectionNo}
     */
    @GetMapping("/{inspectionNo}")
    public ResponseEntity<InspectionDTO> getInspectionById(@PathVariable("inspectionNo") Long inspectionNo) {
        Optional<InspectionDTO> inspection = inspectionService.getInspectionById(inspectionNo);
        if (inspection.isPresent()) {
            return new ResponseEntity<>(inspection.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Get inspections by transformer number
     * GET /api/inspections/transformer/{transformerNo}
     */
    @GetMapping("/transformer/{transformerNo}")
    public ResponseEntity<List<InspectionDTO>> getInspectionsByTransformer(@PathVariable("transformerNo") String transformerNo) {
        try {
            List<InspectionDTO> inspections = inspectionService.getInspectionsByTransformerNo(transformerNo);
            if (inspections.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            }
            return new ResponseEntity<>(inspections, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Update an existing inspection
     * PUT /api/inspections/{inspectionNo}
     */
    @PutMapping("/{inspectionNo}")
    public ResponseEntity<InspectionDTO> updateInspection(
            @PathVariable("inspectionNo") Long inspectionNo,
            @Valid @RequestBody InspectionDTO inspectionDTO) {
        Optional<InspectionDTO> updatedInspection = inspectionService.updateInspection(inspectionNo, inspectionDTO);
        if (updatedInspection.isPresent()) {
            return new ResponseEntity<>(updatedInspection.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Delete an inspection
     * DELETE /api/inspections/{inspectionNo}
     */
    @DeleteMapping("/{inspectionNo}")
    public ResponseEntity<HttpStatus> deleteInspection(@PathVariable("inspectionNo") Long inspectionNo) {
        try {
            boolean deleted = inspectionService.deleteInspection(inspectionNo);
            if (deleted) {
                return new ResponseEntity<>(HttpStatus.NO_CONTENT);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
