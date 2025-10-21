package com.example.transformerthermalinspector.controller;

import com.example.transformerthermalinspector.dto.InspectionDTO;
import com.example.transformerthermalinspector.dto.AnnotationUpdateRequest;
import com.example.transformerthermalinspector.service.InspectionService;
import com.example.transformerthermalinspector.service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;

import java.io.IOException;
import java.nio.file.Path;
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
    private final ImageStorageService imageStorageService;

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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
    
    /**
     * Upload maintenance image for an inspection
     * POST /api/inspections/{inspectionNo}/maintenance-image
     */
    @PostMapping(value = "/{inspectionNo}/maintenance-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InspectionDTO> uploadMaintenanceImage(
            @PathVariable("inspectionNo") Long inspectionNo,
            @RequestParam("image") MultipartFile file,
            @RequestParam(value = "weather", required = false) String weather,
            @RequestParam(value = "confidence", required = false, defaultValue = "0.50") Double confidence) {
        try {
            if (file.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            
            Optional<InspectionDTO> updatedInspection = inspectionService.uploadMaintenanceImage(inspectionNo, file, weather, confidence);
            if (updatedInspection.isPresent()) {
                return new ResponseEntity<>(updatedInspection.get(), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Re-analyze existing maintenance image with different confidence threshold
     * POST /api/inspections/{inspectionNo}/reanalyze
     */
    @PostMapping("/{inspectionNo}/reanalyze")
    public ResponseEntity<InspectionDTO> reanalyzeImage(
            @PathVariable("inspectionNo") Long inspectionNo,
            @RequestParam("confidence") Double confidence) {
        try {
            if (confidence < 0.1 || confidence > 1.0) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            
            Optional<InspectionDTO> updatedInspection = inspectionService.reanalyzeImage(inspectionNo, confidence);
            if (updatedInspection.isPresent()) {
                return new ResponseEntity<>(updatedInspection.get(), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Delete maintenance image from inspection (without deleting inspection)
     * DELETE /api/inspections/{inspectionNo}/maintenance-image
     */
    @DeleteMapping("/{inspectionNo}/maintenance-image")
    public ResponseEntity<InspectionDTO> deleteMaintenanceImage(@PathVariable("inspectionNo") Long inspectionNo) {
        try {
            Optional<InspectionDTO> updatedInspection = inspectionService.deleteMaintenanceImage(inspectionNo);
            
            if (updatedInspection.isPresent()) {
                return new ResponseEntity<>(updatedInspection.get(), HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Serve maintenance image for an inspection
     * GET /api/inspections/{inspectionNo}/maintenance-image
     */
    @GetMapping("/{inspectionNo}/maintenance-image")
    public ResponseEntity<Resource> getMaintenanceImage(@PathVariable("inspectionNo") Long inspectionNo) {
        try {
            Optional<InspectionDTO> inspection = inspectionService.getInspectionById(inspectionNo);
            if (inspection.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            
            String imagePath = inspection.get().getMaintenanceImagePath();
            if (imagePath == null || imagePath.trim().isEmpty()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            
            if (!imageStorageService.imageExists(imagePath, false)) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            
            Path path = imageStorageService.getImagePath(imagePath, false);
            Resource resource = new UrlResource(path.toUri());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + imagePath + "\"")
                    .body(resource);
                    
        } catch (IOException e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Serve maintenance images by filename (for computed URLs)
     * GET /api/inspections/images/{filename}
     */
    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getMaintenanceImageByFilename(@PathVariable String filename) {
        try {
            // Check if file exists
            if (!imageStorageService.imageExists(filename, false)) {
                return ResponseEntity.notFound().build();
            }
            
            Path filePath = imageStorageService.getImagePath(filename, false);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                // Determine content type from file extension
                String contentType = "image/jpeg"; // Default
                String filenameLower = filename.toLowerCase();
                if (filenameLower.endsWith(".png")) {
                    contentType = "image/png";
                } else if (filenameLower.endsWith(".gif")) {
                    contentType = "image/gif";
                } else if (filenameLower.endsWith(".webp")) {
                    contentType = "image/webp";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Save user annotations (added/edited/deleted boxes) for an inspection
     * POST /api/inspections/{inspectionNo}/annotations
     */
    @PostMapping("/{inspectionNo}/annotations")
    public ResponseEntity<InspectionDTO> saveAnnotations(
            @PathVariable("inspectionNo") Long inspectionNo,
            @RequestBody AnnotationUpdateRequest request) {
        try {
            Optional<InspectionDTO> updated = inspectionService.saveAnnotations(inspectionNo, request);
            return updated.map(inspectionDTO -> new ResponseEntity<>(inspectionDTO, HttpStatus.OK))
                    .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Get effective bounding boxes (AI + edited + added - deleted)
     * GET /api/inspections/{inspectionNo}/effective-boxes
     */
    @GetMapping("/{inspectionNo}/effective-boxes")
    public ResponseEntity<String> getEffectiveBoxes(@PathVariable("inspectionNo") Long inspectionNo) {
        try {
            Optional<String> effectiveBoxes = inspectionService.getEffectiveBoxes(inspectionNo);
            return effectiveBoxes.map(boxes -> new ResponseEntity<>(boxes, HttpStatus.OK))
                    .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Recover a deleted bounding box
     * POST /api/inspections/{inspectionNo}/annotations/recover
     */
    @PostMapping("/{inspectionNo}/annotations/recover")
    public ResponseEntity<InspectionDTO> recoverDeletedBox(
            @PathVariable("inspectionNo") Long inspectionNo,
            @RequestBody java.util.Map<String, Object> request) {
        try {
            Optional<InspectionDTO> updated = inspectionService.recoverDeletedBox(inspectionNo, request);
            return updated.map(inspectionDTO -> new ResponseEntity<>(inspectionDTO, HttpStatus.OK))
                    .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
