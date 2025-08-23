package com.example.transformerthermalinspector.controller;

import com.example.transformerthermalinspector.dto.TransformerDTO;
import com.example.transformerthermalinspector.service.TransformerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller for Transformer operations.
 * Handles HTTP requests for transformer management.
 */
@RestController
@RequestMapping("/api/transformers")
@CrossOrigin(origins = "*") // Configure this based on your frontend URL in production
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
     * Get transformers by region
     * GET /api/transformers/region/{region}
     */
    @GetMapping("/region/{region}")
    public ResponseEntity<?> getTransformersByRegion(@PathVariable String region) {
        try {
            List<TransformerDTO> transformers = transformerService.getTransformersByRegion(region);
            return ResponseEntity.ok(transformers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching transformers by region: " + e.getMessage());
        }
    }

    /**
     * Get transformers by type
     * GET /api/transformers/type/{type}
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<?> getTransformersByType(@PathVariable String type) {
        try {
            List<TransformerDTO> transformers = transformerService.getTransformersByType(type);
            return ResponseEntity.ok(transformers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching transformers by type: " + e.getMessage());
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
}
