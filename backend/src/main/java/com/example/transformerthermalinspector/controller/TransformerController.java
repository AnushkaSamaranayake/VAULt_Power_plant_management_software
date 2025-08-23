package com.example.transformerthermalinspector.controller;

import com.example.transformerthermalinspector.dto.TransformerDTO;
import com.example.transformerthermalinspector.service.TransformerService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Transformer operations.
 * Handles HTTP requests for transformer management.
 */
@RestController
@RequestMapping("/api/transformers")
@CrossOrigin(origins = "*") 
@RequiredArgsConstructor
public class TransformerController {

    private final TransformerService transformerService;

    /**
     * Create a new transformer
     * POST /api/transformers
     */
    @PostMapping
    public ResponseEntity<?> createTransformer(@Valid @RequestBody TransformerDTO transformerDTO) {
        try {
            // Check if transformer already exists
            if (transformerService.existsByTransformerNo(transformerDTO.getTransformerNo())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Transformer with number " + transformerDTO.getTransformerNo() + " already exists");
            }

            TransformerDTO createdTransformer = transformerService.saveTransformer(transformerDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdTransformer);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error creating transformer: " + e.getMessage());
        }
    }

    /**
     * Get all transformers
     * GET /api/transformers
     */
    @GetMapping
    public ResponseEntity<?> getAllTransformers() {
        try {
            List<TransformerDTO> transformers = transformerService.getAllTransformers();
            return ResponseEntity.ok(transformers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching transformers: " + e.getMessage());
        }
    }

    /**
     * Get transformer by transformer number
     * GET /api/transformers/{transformerNo}
     */
    @GetMapping("/{transformerNo}")
    public ResponseEntity<?> getTransformerById(@PathVariable String transformerNo) {
        try {
            Optional<TransformerDTO> transformer = transformerService.getTransformerById(transformerNo);
            if (transformer.isPresent()) {
                return ResponseEntity.ok(transformer.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Transformer with number " + transformerNo + " not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching transformer: " + e.getMessage());
        }
    }

    /**
     * Update an existing transformer
     * PUT /api/transformers/{transformerNo}
     */
    @PutMapping("/{transformerNo}")
    public ResponseEntity<?> updateTransformer(@PathVariable String transformerNo, 
                                             @Valid @RequestBody TransformerDTO transformerDTO) {
        try {
            Optional<TransformerDTO> updatedTransformer = transformerService.updateTransformer(transformerNo, transformerDTO);
            if (updatedTransformer.isPresent()) {
                return ResponseEntity.ok(updatedTransformer.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Transformer with number " + transformerNo + " not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating transformer: " + e.getMessage());
        }
    }

    /**
     * Delete a transformer
     * DELETE /api/transformers/{transformerNo}
     */
    @DeleteMapping("/{transformerNo}")
    public ResponseEntity<?> deleteTransformer(@PathVariable String transformerNo) {
        try {
            boolean deleted = transformerService.deleteTransformer(transformerNo);
            if (deleted) {
                return ResponseEntity.ok("Transformer deleted successfully");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Transformer with number " + transformerNo + " not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error deleting transformer: " + e.getMessage());
        }
    }

    /**
     * Upload baseline image for a specific transformer
     * POST /api/transformers/{transformerNo}/baseline-image
     */
    @PostMapping(value = "/{transformerNo}/baseline-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadBaselineImage(
            @PathVariable("transformerNo") String transformerNo,
            @RequestParam("image") MultipartFile imageFile,
            @RequestParam(value = "weather", required = false) String weather) {
        
        try {
            // Validate file
            if (imageFile.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Please select an image file to upload");
            }
            
            // Check file size (limit to 10MB)
            if (imageFile.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("File size exceeds maximum limit of 10MB");
            }
            
            // Check file type
            String contentType = imageFile.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Only image files are allowed");
            }
            
            TransformerDTO updatedTransformer = transformerService.uploadBaselineImage(
                transformerNo, imageFile, weather);
                
            return ResponseEntity.ok(updatedTransformer);
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Transformer with number " + transformerNo + " not found");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error uploading image: " + e.getMessage());
        }
    }

    /**
     * Serve baseline images
     * GET /api/images/{filename}
     */
    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads/images").resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                // Determine content type
                String contentType = "image/jpeg"; // Default
                if (filename.toLowerCase().endsWith(".png")) {
                    contentType = "image/png";
                } else if (filename.toLowerCase().endsWith(".gif")) {
                    contentType = "image/gif";
                }
                
                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
