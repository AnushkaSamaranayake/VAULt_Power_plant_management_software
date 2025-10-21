package com.example.transformerthermalinspector.service;

import com.example.transformerthermalinspector.dao.Inspection;
import com.example.transformerthermalinspector.dto.InspectionDTO;
import com.example.transformerthermalinspector.repository.InspectionRepository;
import com.example.transformerthermalinspector.dto.AnnotationUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service class for Inspection-related business logic.
 * Handles CRUD operations and converts between Entity and DTO.
 */
@Service
@RequiredArgsConstructor // Generates constructor for final fields (dependency injection)
public class InspectionService {

    private final InspectionRepository inspectionRepository;
    private final ModelMapper modelMapper; // For Entity ↔ DTO conversion
    private final ImageStorageService imageStorageService;
    private final YoloAiService yoloAiService;

    /**
     * Retrieve all inspections from database
     * @return List of InspectionDTOs
     */
    public List<InspectionDTO> getAllInspections() {
        return inspectionRepository.findAll()
                .stream()
                .map(inspection -> modelMapper.map(inspection, InspectionDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Find inspection by inspection number (primary key)
     * @param inspectionNo The inspection number to search for
     * @return Optional InspectionDTO if found
     */
    public Optional<InspectionDTO> getInspectionById(Long inspectionNo) {
        return inspectionRepository.findById(inspectionNo)
                .map(inspection -> modelMapper.map(inspection, InspectionDTO.class));
    }

    /**
     * Find all inspections for a specific transformer
     * @param transformerNo The transformer number to filter by
     * @return List of inspections for the transformer
     */
    public List<InspectionDTO> getInspectionsByTransformerNo(String transformerNo) {
        return inspectionRepository.findByTransformerNo(transformerNo)
                .stream()
                .map(inspection -> modelMapper.map(inspection, InspectionDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Save a new inspection to the database
     * @param inspectionDTO The inspection data to save
     * @return Saved InspectionDTO with any generated fields
     */
    public InspectionDTO saveInspection(InspectionDTO inspectionDTO) {
        Inspection inspection = modelMapper.map(inspectionDTO, Inspection.class);
        Inspection savedInspection = inspectionRepository.save(inspection);
        return modelMapper.map(savedInspection, InspectionDTO.class);
    }

    /**
     * Update an existing inspection
     * @param inspectionNo The inspection number to update
     * @param inspectionDTO The updated inspection data
     * @return Updated InspectionDTO if found, empty Optional otherwise
     */
    public Optional<InspectionDTO> updateInspection(Long inspectionNo, InspectionDTO inspectionDTO) {
        return inspectionRepository.findById(inspectionNo)
                .map(existingInspection -> {
                    modelMapper.map(inspectionDTO, existingInspection);
                    existingInspection.setInspectionNo(inspectionNo); // Ensure ID remains unchanged
                    Inspection savedInspection = inspectionRepository.save(existingInspection);
                    return modelMapper.map(savedInspection, InspectionDTO.class);
                });
    }

    /**
     * Delete an inspection by inspection number
     * @param inspectionNo The inspection number to delete
     * @return true if deleted successfully, false if not found
     */
    public boolean deleteInspection(Long inspectionNo) {
        if (inspectionRepository.existsById(inspectionNo)) {
            // Get the inspection to check for image
            Optional<Inspection> inspectionOpt = inspectionRepository.findById(inspectionNo);
            if (inspectionOpt.isPresent()) {
                Inspection inspection = inspectionOpt.get();
                // Delete maintenance image if exists
                if (inspection.getMaintenanceImagePath() != null && !inspection.getMaintenanceImagePath().trim().isEmpty()) {
                    try {
                        System.out.println("InspectionService - Deleting maintenance image: " + inspection.getMaintenanceImagePath());
                        imageStorageService.deleteImage(inspection.getMaintenanceImagePath(), false);
                        System.out.println("InspectionService - Maintenance image deleted successfully");
                    } catch (IOException e) {
                        System.err.println("Failed to delete maintenance image: " + inspection.getMaintenanceImagePath());
                        e.printStackTrace();
                        // Continue with inspection deletion even if image deletion fails
                    }
                }
            }
            
            inspectionRepository.deleteById(inspectionNo);
            return true;
        }
        return false;
    }
    
    /**
     * Delete maintenance image from inspection (without deleting inspection)
     * @param inspectionNo The inspection number
     * @return Updated InspectionDTO if found, empty Optional otherwise
     */
    public Optional<InspectionDTO> deleteMaintenanceImage(Long inspectionNo) {
        return inspectionRepository.findById(inspectionNo)
                .map(inspection -> {
                    try {
                        // Delete image file if exists
                        if (inspection.getMaintenanceImagePath() != null && !inspection.getMaintenanceImagePath().trim().isEmpty()) {
                            System.out.println("InspectionService - Deleting maintenance image: " + inspection.getMaintenanceImagePath());
                            imageStorageService.deleteImage(inspection.getMaintenanceImagePath(), false); // false = maintenance
                            System.out.println("InspectionService - Maintenance image deleted successfully");
                        }
                        
                        // Clear image-related fields from inspection
                        inspection.setMaintenanceImagePath(null);
                        inspection.setMaintenanceImageUploadDateAndTime(null);
                        inspection.setWeather(null);


                        // Clear all bounding box columns
                        inspection.setAiBoundingBoxes(null);
                        inspection.setEditedOrManuallyAddedBoxes(null);
                        inspection.setDeletedBoundingBoxes(null);

                        // Set AI analysis status to pending
                        inspection.setState("pending");

                        // Save updated inspection
                        Inspection savedInspection = inspectionRepository.save(inspection);
                        return modelMapper.map(savedInspection, InspectionDTO.class);
                        
                    } catch (IOException e) {
                        System.err.println("Failed to delete maintenance image: " + inspection.getMaintenanceImagePath());
                        e.printStackTrace();
                        throw new RuntimeException("Failed to delete maintenance image", e);
                    }
                });
    }
    
    /**
     * Upload maintenance image for an inspection
     * @param inspectionNo The inspection number
     * @param file The image file to upload
     * @param weather The weather conditions during inspection (optional)
     * @return Updated InspectionDTO with image path
     */
    public Optional<InspectionDTO> uploadMaintenanceImage(Long inspectionNo, MultipartFile file, String weather) {
        return uploadMaintenanceImage(inspectionNo, file, weather, 0.50); // Default confidence
    }

    /**
     * Upload maintenance image for an inspection with custom confidence
     * @param inspectionNo The inspection number
     * @param file The image file to upload
     * @param weather The weather conditions during inspection (optional)
     * @param confidence The confidence threshold for AI analysis (0.1-1.0)
     * @return Updated InspectionDTO with image path
     */
    public Optional<InspectionDTO> uploadMaintenanceImage(Long inspectionNo, MultipartFile file, String weather, Double confidence) {
        return inspectionRepository.findById(inspectionNo)
                .map(inspection -> {
                    try {
                        // Delete old image if exists
                        if (inspection.getMaintenanceImagePath() != null && !inspection.getMaintenanceImagePath().trim().isEmpty()) {
                            System.out.println("InspectionService - Deleting old maintenance image: " + inspection.getMaintenanceImagePath());
                            imageStorageService.deleteImage(inspection.getMaintenanceImagePath(), false);
                        }
                        
                        // Store new image
                        String filename = imageStorageService.storeMaintenanceImage(file, inspectionNo);
                        inspection.setMaintenanceImagePath(filename);
                        
                        // Update image upload timestamp
                        inspection.setMaintenanceImageUploadDateAndTime(LocalDateTime.now());
                        
                        // Update weather conditions if provided
                        System.out.println("InspectionService - Weather parameter received: '" + weather + "'");
                        if (weather != null && !weather.trim().isEmpty()) {
                            String weatherTrimmed = weather.trim();
                            System.out.println("InspectionService - Setting weather to: '" + weatherTrimmed + "'");
                            inspection.setWeather(weatherTrimmed);
                        } else {
                            System.out.println("InspectionService - Weather parameter is null or empty, not setting weather");
                        }
                        
                        // Set AI analysis status to pending (using state column)
                        inspection.setState("AI Analysis Pending");
                        inspection.setAiBoundingBoxes(null); // Clear previous analysis
                        
                        // Save inspection first to persist the image
                        Inspection savedInspection = inspectionRepository.save(inspection);
                        System.out.println("InspectionService - Maintenance image uploaded successfully: " + filename);
                        System.out.println("InspectionService - Weather saved to DB: '" + savedInspection.getWeather() + "'");
                        
                        // Trigger AI analysis asynchronously (in a separate thread to not block the response)
                        // Copy bytes and filename here to avoid using MultipartFile after the request returns
                        byte[] imageBytes = file.getBytes();
                        String originalFilename = file.getOriginalFilename();
                        analyzeImageAsync(savedInspection.getInspectionNo(), imageBytes, originalFilename, confidence);
                        
                        return modelMapper.map(savedInspection, InspectionDTO.class);
                    } catch (IOException e) {
                        System.err.println("Failed to upload maintenance image for inspection: " + inspectionNo);
                        e.printStackTrace();
                        throw new RuntimeException("Failed to upload maintenance image", e);
                    }
                });
    }
    
    /**
     * Re-analyze existing maintenance image with different confidence threshold
     * @param inspectionNo The inspection number
     * @param confidence The confidence threshold for AI analysis (0.1-1.0)
     * @return Updated InspectionDTO if found, empty Optional otherwise
     */
    public Optional<InspectionDTO> reanalyzeImage(Long inspectionNo, Double confidence) {
        return inspectionRepository.findById(inspectionNo)
                .map(inspection -> {
                    if (inspection.getMaintenanceImagePath() == null || inspection.getMaintenanceImagePath().trim().isEmpty()) {
                        throw new RuntimeException("No maintenance image found for re-analysis");
                    }
                    
                    try {
                        // Set AI analysis status to pending (using state column)
                        inspection.setState("AI Analysis Pending");
                        inspection.setAiBoundingBoxes(null); // Clear previous analysis
                        
                        // Save inspection first to persist the pending status
                        Inspection savedInspection = inspectionRepository.save(inspection);
                        
                        // Get image file from storage
                        Path imagePath = imageStorageService.getImagePath(inspection.getMaintenanceImagePath(), false);
                        byte[] imageBytes = java.nio.file.Files.readAllBytes(imagePath);
                        
                        // Trigger AI analysis asynchronously with new confidence
                        analyzeImageAsync(savedInspection.getInspectionNo(), imageBytes, inspection.getMaintenanceImagePath(), confidence);
                        
                        return modelMapper.map(savedInspection, InspectionDTO.class);
                    } catch (Exception e) {
                        System.err.println("Failed to re-analyze image for inspection: " + inspectionNo);
                        e.printStackTrace();
                        throw new RuntimeException("Failed to re-analyze image", e);
                    }
                });
    }
    
    /**
     * Analyze image asynchronously using YOLO AI service with custom confidence
     * @param inspectionNo The inspection number
     * @param imageBytes The image bytes to analyze
     * @param originalFilename The original filename
     * @param confidence The confidence threshold for AI analysis
     */
    private void analyzeImageAsync(Long inspectionNo, byte[] imageBytes, String originalFilename, Double confidence) {
        // Run analysis in a separate thread to not block the upload response
        new Thread(() -> {
            try {
                System.out.println("InspectionService - Starting AI analysis for inspection: " + inspectionNo + " with confidence: " + confidence);
                
                // Call YOLO API for analysis with custom confidence
                String boundingBoxes = yoloAiService.analyzeImage(imageBytes, originalFilename, confidence);
                
                // Update inspection with analysis results
                inspectionRepository.findById(inspectionNo).ifPresent(inspection -> {
                    inspection.setAiBoundingBoxes(boundingBoxes);
                    inspection.setState("AI Analysis Completed");
                    inspectionRepository.save(inspection);
                    System.out.println("InspectionService - AI analysis completed for inspection: " + inspectionNo);
                });
                
            } catch (Exception e) {
                System.err.println("InspectionService - AI analysis failed for inspection: " + inspectionNo);
                e.printStackTrace();
                
                // Update inspection with failure status
                inspectionRepository.findById(inspectionNo).ifPresent(inspection -> {
                    inspection.setState("AI Analysis Failed");
                    inspectionRepository.save(inspection);
                });
            }
        }).start();
    }

    /**
     * Save user annotations and rebuild ai_bounding_boxes by removing edited/deleted items
     * @param inspectionNo the inspection identifier
     * @param request json payload containing editedOrManuallyAddedBoxes and deletedBoundingBoxes
     * @return updated InspectionDTO
     */
    public Optional<InspectionDTO> saveAnnotations(Long inspectionNo, AnnotationUpdateRequest request) {
        return inspectionRepository.findById(inspectionNo)
                .map(inspection -> {
                    try {
                        // Parse incoming annotations
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        java.util.List<java.util.Map<String, Object>> editedList = new java.util.ArrayList<>();
                        java.util.List<java.util.Map<String, Object>> deletedList = new java.util.ArrayList<>();
                        
                        if (request.getEditedOrManuallyAddedBoxes() != null && !request.getEditedOrManuallyAddedBoxes().trim().isEmpty()) {
                            editedList = mapper.readValue(request.getEditedOrManuallyAddedBoxes(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {});
                        }
                        if (request.getDeletedBoundingBoxes() != null && !request.getDeletedBoundingBoxes().trim().isEmpty()) {
                            deletedList = mapper.readValue(request.getDeletedBoundingBoxes(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {});
                        }

                        // Prevent double-accounting: if a box is edited, do not simultaneously mark it as deleted
                        if (!editedList.isEmpty() && !deletedList.isEmpty()) {
                            java.util.Set<Integer> toRemoveIdx = new java.util.HashSet<>();
                            for (int d = 0; d < deletedList.size(); d++) {
                                java.util.Map<String, Object> del = deletedList.get(d);
                                java.util.List<Double> delCoords = toDoubleList(del.get("box"));
                                if (delCoords == null) continue;
                                boolean overlapsEdit = false;
                                for (java.util.Map<String, Object> ed : editedList) {
                                    java.util.List<Double> edOrig = toDoubleList(ed.get("originalBox"));
                                    java.util.List<Double> edCur = toDoubleList(ed.get("box"));
                                    if ((edOrig != null && boxesMatch(delCoords, edOrig, 2.0)) ||
                                        (edCur != null && boxesMatch(delCoords, edCur, 2.0))) {
                                        overlapsEdit = true;
                                        break;
                                    }
                                }
                                if (overlapsEdit) {
                                    toRemoveIdx.add(d);
                                }
                            }
                            if (!toRemoveIdx.isEmpty()) {
                                java.util.List<java.util.Map<String, Object>> filtered = new java.util.ArrayList<>();
                                for (int i = 0; i < deletedList.size(); i++) {
                                    if (!toRemoveIdx.contains(i)) filtered.add(deletedList.get(i));
                                }
                                deletedList = filtered;
                            }
                        }
                        
                        // Parse existing persisted annotations to merge with incoming changes
                        java.util.List<java.util.Map<String, Object>> existingEdited = new java.util.ArrayList<>();
                        if (inspection.getEditedOrManuallyAddedBoxes() != null && !inspection.getEditedOrManuallyAddedBoxes().trim().isEmpty()) {
                            existingEdited = mapper.readValue(inspection.getEditedOrManuallyAddedBoxes(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {});
                        }
                        java.util.List<java.util.Map<String, Object>> existingDeleted = new java.util.ArrayList<>();
                        if (inspection.getDeletedBoundingBoxes() != null && !inspection.getDeletedBoundingBoxes().trim().isEmpty()) {
                            existingDeleted = mapper.readValue(inspection.getDeletedBoundingBoxes(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {});
                        }
                        
                        java.util.List<java.util.Map<String, Object>> mergedEdited = new java.util.ArrayList<>(existingEdited);
                        java.util.List<java.util.Map<String, Object>> mergedDeleted = new java.util.ArrayList<>(existingDeleted);
                        
                        // Parse current AI bounding boxes
                        java.util.List<java.util.Map<String, Object>> aiBoxes = new java.util.ArrayList<>();
                        if (inspection.getAiBoundingBoxes() != null && !inspection.getAiBoundingBoxes().trim().isEmpty()) {
                            java.util.Map<String, Object> aiData = mapper.readValue(inspection.getAiBoundingBoxes(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                            if (aiData.containsKey("predictions")) {
                                aiBoxes = (java.util.List<java.util.Map<String, Object>>) aiData.get("predictions");
                            }
                        }
                        
                        // Remove edited and deleted boxes from AI boxes (by matching coordinates within tolerance)
                        java.util.List<java.util.Map<String, Object>> remainingAiBoxes = new java.util.ArrayList<>();
                        for (java.util.Map<String, Object> aiBox : aiBoxes) {
                            java.util.List<Double> aiCoords = toDoubleList(aiBox.get("box"));
                            if (aiCoords == null) {
                                continue;
                            }
                            boolean shouldRemove = false;
                            
                            // Check edited list: only remove AI predictions that match the ORIGINAL box for true edits
                            for (java.util.Map<String, Object> edited : editedList) {
                                String type = edited.get("type") != null ? edited.get("type").toString().toLowerCase() : "added";
                                if ("edited".equals(type)) {
                                    if (edited.containsKey("originalBox")) {
                                        java.util.List<Double> origCoords = toDoubleList(edited.get("originalBox"));
                                        if (boxesMatch(aiCoords, origCoords, 2.0)) {
                                            shouldRemove = true;
                                            break;
                                        }
                                    } else if (edited.containsKey("box")) {
                                        // Fallback: if originalBox missing, use current box as a best effort
                                        java.util.List<Double> currentCoords = toDoubleList(edited.get("box"));
                                        if (boxesMatch(aiCoords, currentCoords, 2.0)) {
                                            shouldRemove = true;
                                            break;
                                        }
                                    }
                                }
                                // For 'added' or other types, do NOT remove AI boxes
                            }
                            
                            // Check if this AI box is in deleted list
                            if (!shouldRemove) {
                                for (java.util.Map<String, Object> deleted : deletedList) {
                                    java.util.List<Double> delCoords = toDoubleList(deleted.get("box"));
                                    if (boxesMatch(aiCoords, delCoords, 2.0)) {
                                        shouldRemove = true;
                                        break;
                                    }
                                }
                            }
                            
                            if (!shouldRemove) {
                                remainingAiBoxes.add(aiBox);
                            }
                        }
                        
                        // Rebuild ai_bounding_boxes with remaining boxes
                        java.util.Map<String, Object> newAiData = new java.util.HashMap<>();
                        newAiData.put("predictions", remainingAiBoxes);
                        inspection.setAiBoundingBoxes(mapper.writeValueAsString(newAiData));
                        
                        // Process deletions first so manual entries are removed before applying edits/additions
                        for (java.util.Map<String, Object> deleted : deletedList) {
                            java.util.List<Double> deletedCoords = toDoubleList(deleted.get("box"));
                            if (deletedCoords == null) {
                                continue;
                            }
                            
                            String deletedFrom = deleted.get("deletedFrom") != null ? deleted.get("deletedFrom").toString() : null;
                            if (deletedFrom == null || deletedFrom.trim().isEmpty()) {
                                boolean matchesEdited = existingEdited.stream()
                                        .anyMatch(existing -> boxesMatch(deletedCoords, toDoubleList(existing.get("box")), 2.0));
                                deletedFrom = matchesEdited ? "edited" : "ai";
                                deleted.put("deletedFrom", deletedFrom);
                            }
                            
                            if ("edited".equalsIgnoreCase(deletedFrom) || "manual".equalsIgnoreCase(deletedFrom)) {
                                mergedEdited.removeIf(existing -> boxesMatch(deletedCoords, toDoubleList(existing.get("box")), 2.0));
                            }
                            
                            final String deletedFromFinal = deletedFrom;
                            boolean alreadyLogged = mergedDeleted.stream().anyMatch(existingDeletedEntry -> {
                                java.util.List<Double> existingCoords = toDoubleList(existingDeletedEntry.get("box"));
                                if (!boxesMatch(deletedCoords, existingCoords, 0.5)) {
                                    return false;
                                }
                                Object existingOrigin = existingDeletedEntry.get("deletedFrom");
                                if (existingOrigin == null && deletedFromFinal == null) {
                                    return true;
                                }
                                if (existingOrigin == null || deletedFromFinal == null) {
                                    return false;
                                }
                                return existingOrigin.toString().equalsIgnoreCase(deletedFromFinal);
                            });
                            
                            if (!alreadyLogged) {
                                mergedDeleted.add(deleted);
                            }
                        }
                        
                        // Apply additions/edits to merged list
                        for (java.util.Map<String, Object> edited : editedList) {
                            String type = edited.getOrDefault("type", "added").toString();
                            java.util.List<Double> currentCoords = toDoubleList(edited.get("box"));
                            if (currentCoords == null) {
                                continue;
                            }
                            
                            if ("edited".equalsIgnoreCase(type)) {
                                java.util.List<Double> originalCoords = toDoubleList(edited.get("originalBox"));
                                boolean updated = false;
                                if (originalCoords != null) {
                                    for (java.util.Map<String, Object> existing : mergedEdited) {
                                        java.util.List<Double> existingOriginal = toDoubleList(existing.get("originalBox"));
                                        java.util.List<Double> existingCurrent = toDoubleList(existing.get("box"));
                                        if ((existingOriginal != null && boxesMatch(existingOriginal, originalCoords, 2.0)) ||
                                            (existingCurrent != null && boxesMatch(existingCurrent, originalCoords, 2.0))) {
                                            existing.put("box", currentCoords);
                                            if (edited.containsKey("originalBox")) {
                                                existing.put("originalBox", edited.get("originalBox"));
                                            }
                                            existing.put("class", edited.get("class"));
                                            existing.put("confidence", edited.get("confidence"));
                                            existing.put("comment", edited.get("comment"));
                                            existing.put("type", edited.get("type"));
                                            existing.put("timestamp", edited.get("timestamp"));
                                            existing.put("userId", edited.get("userId"));
                                            updated = true;
                                            break;
                                        }
                                    }
                                }
                                if (!updated) {
                                    mergedEdited.add(edited);
                                }
                            } else {
                                boolean updated = false;
                                for (java.util.Map<String, Object> existing : mergedEdited) {
                                    java.util.List<Double> existingCoords = toDoubleList(existing.get("box"));
                                    if (existingCoords != null && boxesMatch(existingCoords, currentCoords, 2.0)) {
                                        existing.put("class", edited.get("class"));
                                        existing.put("confidence", edited.get("confidence"));
                                        existing.put("comment", edited.get("comment"));
                                        existing.put("type", edited.get("type"));
                                        existing.put("timestamp", edited.get("timestamp"));
                                        existing.put("userId", edited.get("userId"));
                                        updated = true;
                                        break;
                                    }
                                }
                                if (!updated) {
                                    mergedEdited.add(edited);
                                }
                            }
                        }

                        // Finally, ensure no deleted entry remains for anything that's now edited/added
                        if (!mergedDeleted.isEmpty() && !mergedEdited.isEmpty()) {
                            java.util.List<java.util.Map<String, Object>> cleanedDeleted = new java.util.ArrayList<>();
                            for (java.util.Map<String, Object> del : mergedDeleted) {
                                java.util.List<Double> delCoords = toDoubleList(del.get("box"));
                                if (delCoords == null) {
                                    cleanedDeleted.add(del); // keep malformed safely
                                    continue;
                                }
                                boolean conflicts = false;
                                for (java.util.Map<String, Object> ed : mergedEdited) {
                                    java.util.List<Double> edCur = toDoubleList(ed.get("box"));
                                    java.util.List<Double> edOrig = toDoubleList(ed.get("originalBox"));
                                    if ((edCur != null && boxesMatch(delCoords, edCur, 2.0)) ||
                                        (edOrig != null && boxesMatch(delCoords, edOrig, 2.0))) {
                                        conflicts = true;
                                        break;
                                    }
                                }
                                if (!conflicts) cleanedDeleted.add(del);
                            }
                            mergedDeleted = cleanedDeleted;
                        }
                        
                        // Store merged annotations
                        try {
                            System.out.println("InspectionService.saveAnnotations - inspection=" + inspectionNo
                                + " edited=" + mergedEdited.size() + " deleted=" + mergedDeleted.size());
                        } catch (Exception ignore) {}
                        inspection.setEditedOrManuallyAddedBoxes(mapper.writeValueAsString(mergedEdited));
                        inspection.setDeletedBoundingBoxes(mapper.writeValueAsString(mergedDeleted));
                        
                        Inspection saved = inspectionRepository.save(inspection);
                        try {
                            System.out.println("InspectionService.saveAnnotations - persisted edited length="
                                + (saved.getEditedOrManuallyAddedBoxes() != null ? saved.getEditedOrManuallyAddedBoxes().length() : 0)
                                + " deleted length="
                                + (saved.getDeletedBoundingBoxes() != null ? saved.getDeletedBoundingBoxes().length() : 0));
                        } catch (Exception ignore) {}
                        return modelMapper.map(saved, InspectionDTO.class);
                    } catch (Exception e) {
                        System.err.println("Failed to process annotations: " + e.getMessage());
                        e.printStackTrace();
                        throw new RuntimeException("Failed to save annotations", e);
                    }
                });
    }
    
    /**
     * Helper method to check if two bounding boxes match within tolerance
     */
    private boolean boxesMatch(java.util.List<Double> box1, java.util.List<Double> box2, double tolerance) {
        if (box1 == null || box2 == null || box1.size() != 4 || box2.size() != 4) {
            return false;
        }
        double b1_0 = ((Number)box1.get(0)).doubleValue();
        double b1_1 = ((Number)box1.get(1)).doubleValue();
        double b1_2 = ((Number)box1.get(2)).doubleValue();
        double b1_3 = ((Number)box1.get(3)).doubleValue();
        double b2_0 = ((Number)box2.get(0)).doubleValue();
        double b2_1 = ((Number)box2.get(1)).doubleValue();
        double b2_2 = ((Number)box2.get(2)).doubleValue();
        double b2_3 = ((Number)box2.get(3)).doubleValue();
        return Math.abs(b1_0 - b2_0) < tolerance &&
               Math.abs(b1_1 - b2_1) < tolerance &&
               Math.abs(b1_2 - b2_2) < tolerance &&
               Math.abs(b1_3 - b2_3) < tolerance;
    }
    
    /**
     * Helper to safely convert heterogeneous list representations to a List<Double>
     */
    private java.util.List<Double> toDoubleList(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof java.util.List<?>) {
            java.util.List<?> raw = (java.util.List<?>) value;
            java.util.List<Double> result = new java.util.ArrayList<>(raw.size());
            for (Object item : raw) {
                if (item == null) {
                    return null;
                }
                if (item instanceof Number) {
                    result.add(((Number) item).doubleValue());
                } else {
                    try {
                        result.add(Double.parseDouble(item.toString()));
                    } catch (NumberFormatException ex) {
                        return null;
                    }
                }
            }
            return result;
        }
        return null;
    }
    
    /**
     * Get effective bounding boxes (AI + edited + added - deleted)
     * @param inspectionNo the inspection identifier
     * @return JSON string with merged predictions
     */
    public Optional<String> getEffectiveBoxes(Long inspectionNo) {
        return inspectionRepository.findById(inspectionNo)
                .map(inspection -> {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        java.util.List<java.util.Map<String, Object>> effectiveBoxes = new java.util.ArrayList<>();

                        // Build helper lists: deleted boxes and edited originals (to suppress AI duplicates)
                        java.util.List<java.util.List<Double>> deletedBoxes = new java.util.ArrayList<>();
                        if (inspection.getDeletedBoundingBoxes() != null && !inspection.getDeletedBoundingBoxes().trim().isEmpty()) {
                            java.util.List<java.util.Map<String, Object>> deletedList = mapper.readValue(
                                inspection.getDeletedBoundingBoxes(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {}
                            );
                            for (java.util.Map<String, Object> del : deletedList) {
                                java.util.List<Double> coords = toDoubleList(del.get("box"));
                                if (coords != null) deletedBoxes.add(coords);
                            }
                        }

                        java.util.List<java.util.List<Double>> editedOriginals = new java.util.ArrayList<>();
                        java.util.List<java.util.Map<String, Object>> editedListFull = new java.util.ArrayList<>();
                        if (inspection.getEditedOrManuallyAddedBoxes() != null && !inspection.getEditedOrManuallyAddedBoxes().trim().isEmpty()) {
                            editedListFull = mapper.readValue(
                                inspection.getEditedOrManuallyAddedBoxes(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {}
                            );
                            for (java.util.Map<String, Object> ed : editedListFull) {
                                java.util.List<Double> ob = toDoubleList(ed.get("originalBox"));
                                if (ob != null) editedOriginals.add(ob);
                            }
                        }
                        
                        // Add AI bounding boxes
                        if (inspection.getAiBoundingBoxes() != null && !inspection.getAiBoundingBoxes().trim().isEmpty()) {
                            java.util.Map<String, Object> aiData = mapper.readValue(inspection.getAiBoundingBoxes(), 
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                            if (aiData.containsKey("predictions")) {
                                java.util.List<java.util.Map<String, Object>> aiBoxes =
                                    (java.util.List<java.util.Map<String, Object>>) aiData.get("predictions");
                                // include simple metadata for AI predictions, but skip those deleted or replaced by edits
                                for (java.util.Map<String, Object> aiBox : aiBoxes) {
                                    java.util.List<Double> aiCoords = toDoubleList(aiBox.get("box"));
                                    boolean suppressed = false;
                                    if (aiCoords != null) {
                                        // Skip if explicitly deleted
                                        for (java.util.List<Double> del : deletedBoxes) {
                                            if (boxesMatch(aiCoords, del, 2.0)) { suppressed = true; break; }
                                        }
                                        // Skip if there is an edited original matching this AI prediction
                                        if (!suppressed) {
                                            for (java.util.List<Double> ob : editedOriginals) {
                                                if (boxesMatch(aiCoords, ob, 2.0)) { suppressed = true; break; }
                                            }
                                        }
                                    }
                                    if (suppressed) continue;

                                    java.util.Map<String, Object> pred = new java.util.HashMap<>();
                                    pred.put("box", aiBox.get("box"));
                                    pred.put("class", aiBox.get("class"));
                                    pred.put("confidence", aiBox.get("confidence"));
                                    pred.put("source", "ai");
                                    pred.put("type", "ai");
                                    effectiveBoxes.add(pred);
                                }
                            }
                        }
                        
                        // Add edited and manually added boxes, excluding those that were deleted
                        for (java.util.Map<String, Object> item : editedListFull) {
                            java.util.List<Double> editedCoords = toDoubleList(item.get("box"));
                            boolean isDeleted = false;
                            if (editedCoords != null) {
                                for (java.util.List<Double> del : deletedBoxes) {
                                    if (boxesMatch(editedCoords, del, 2.0)) { isDeleted = true; break; }
                                }
                            }
                            if (isDeleted) continue;

                            // Convert annotation format to prediction format and keep metadata for frontend
                            java.util.Map<String, Object> pred = new java.util.HashMap<>();
                            pred.put("box", item.get("box"));
                            pred.put("class", item.get("class"));
                            pred.put("confidence", item.get("confidence"));
                            pred.put("source", "edited");
                            if (item.containsKey("type")) pred.put("type", item.get("type"));
                            if (item.containsKey("comment")) pred.put("comment", item.get("comment"));
                            if (item.containsKey("timestamp")) pred.put("timestamp", item.get("timestamp"));
                            if (item.containsKey("userId")) pred.put("userId", item.get("userId"));
                            if (item.containsKey("originalBox")) pred.put("originalBox", item.get("originalBox"));
                            effectiveBoxes.add(pred);
                        }
                        
                        // Wrap in predictions format
                        java.util.Map<String, Object> result = new java.util.HashMap<>();
                        result.put("predictions", effectiveBoxes);
                        return mapper.writeValueAsString(result);
                    } catch (Exception e) {
                        System.err.println("Failed to get effective boxes: " + e.getMessage());
                        e.printStackTrace();
                        return "{\"predictions\":[]}";
                    }
                });
    }
    
    /**
     * Recover a deleted bounding box
     * @param inspectionNo the inspection identifier
     * @param request contains the box to recover and optional metadata
     * @return updated InspectionDTO
     */
    public Optional<InspectionDTO> recoverDeletedBox(Long inspectionNo, java.util.Map<String, Object> request) {
        return inspectionRepository.findById(inspectionNo)
                .map(inspection -> {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        
                        // Get the box to recover
                        java.util.List<Double> boxToRecover = (java.util.List<Double>) request.get("box");
                        if (boxToRecover == null) {
                            throw new RuntimeException("Box coordinates are required");
                        }
                        
                        // Parse deleted boxes
                        java.util.List<java.util.Map<String, Object>> deletedList = new java.util.ArrayList<>();
                        if (inspection.getDeletedBoundingBoxes() != null && !inspection.getDeletedBoundingBoxes().trim().isEmpty()) {
                            deletedList = mapper.readValue(inspection.getDeletedBoundingBoxes(), 
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {});
                        }
                        
                        // Find and remove the box from deleted list
                        java.util.Map<String, Object> recoveredBox = null;
                        java.util.List<java.util.Map<String, Object>> remainingDeleted = new java.util.ArrayList<>();
                        for (java.util.Map<String, Object> deleted : deletedList) {
                            java.util.List<Double> delCoords = (java.util.List<Double>) deleted.get("box");
                            if (boxesMatch(boxToRecover, delCoords, 2.0)) {
                                recoveredBox = deleted;
                            } else {
                                remainingDeleted.add(deleted);
                            }
                        }
                        
                        if (recoveredBox == null) {
                            throw new RuntimeException("Box not found in deleted list");
                        }
                        
                        // Determine destination based on deletedFrom flag if present
                        String destination = (String) request.getOrDefault("destination", null);
                        if (destination == null && recoveredBox.containsKey("deletedFrom")) {
                            destination = (String) recoveredBox.get("deletedFrom");
                        }
                        if (destination == null || destination.trim().isEmpty()) {
                            destination = "edited";
                        }
                        destination = destination.toLowerCase();
                        if ("manual".equals(destination)) {
                            destination = "edited";
                        }
                        
                        if ("ai".equals(destination)) {
                            // Recover to AI bounding boxes
                            java.util.List<java.util.Map<String, Object>> aiBoxes = new java.util.ArrayList<>();
                            if (inspection.getAiBoundingBoxes() != null && !inspection.getAiBoundingBoxes().trim().isEmpty()) {
                                java.util.Map<String, Object> aiData = mapper.readValue(inspection.getAiBoundingBoxes(), 
                                    new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                                if (aiData.containsKey("predictions")) {
                                    aiBoxes = (java.util.List<java.util.Map<String, Object>>) aiData.get("predictions");
                                }
                            }
                            java.util.List<Double> recoveredCoords = toDoubleList(recoveredBox.get("box"));
                            if (recoveredCoords != null) {
                                aiBoxes.removeIf(existing -> boxesMatch(toDoubleList(existing.get("box")), recoveredCoords, 0.5));
                            }
                            // Add recovered box as AI prediction
                            java.util.Map<String, Object> aiBox = new java.util.HashMap<>();
                            aiBox.put("box", recoveredBox.get("box"));
                            aiBox.put("class", recoveredBox.get("class"));
                            aiBox.put("confidence", recoveredBox.get("confidence"));
                            aiBoxes.add(aiBox);
                            java.util.Map<String, Object> newAiData = new java.util.HashMap<>();
                            newAiData.put("predictions", aiBoxes);
                            inspection.setAiBoundingBoxes(mapper.writeValueAsString(newAiData));
                        } else { // edited/manually added
                            // Recover to edited/manually added boxes
                            java.util.List<java.util.Map<String, Object>> editedList = new java.util.ArrayList<>();
                            if (inspection.getEditedOrManuallyAddedBoxes() != null && !inspection.getEditedOrManuallyAddedBoxes().trim().isEmpty()) {
                                editedList = mapper.readValue(inspection.getEditedOrManuallyAddedBoxes(), 
                                    new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {});
                            }
                            java.util.List<Double> recoveredCoords = toDoubleList(recoveredBox.get("box"));
                            if (recoveredCoords != null) {
                                editedList.removeIf(existing -> boxesMatch(toDoubleList(existing.get("box")), recoveredCoords, 0.5));
                            }
                            java.util.Map<String, Object> newBox = new java.util.HashMap<>();
                            newBox.put("type", "recovered");
                            newBox.put("box", recoveredBox.get("box"));
                            newBox.put("class", recoveredBox.get("class"));
                            newBox.put("confidence", recoveredBox.get("confidence"));
                            newBox.put("comment", recoveredBox.get("comment"));
                            if (recoveredBox.containsKey("timestamp")) {
                                newBox.put("timestamp", recoveredBox.get("timestamp"));
                            }
                            if (recoveredBox.containsKey("userId")) {
                                newBox.put("userId", recoveredBox.get("userId"));
                            }
                            editedList.add(newBox);
                            inspection.setEditedOrManuallyAddedBoxes(mapper.writeValueAsString(editedList));
                        }
                        
                        // Update deleted list
                        inspection.setDeletedBoundingBoxes(mapper.writeValueAsString(remainingDeleted));
                        
                        Inspection saved = inspectionRepository.save(inspection);
                        return modelMapper.map(saved, InspectionDTO.class);
                    } catch (Exception e) {
                        System.err.println("Failed to recover deleted box: " + e.getMessage());
                        e.printStackTrace();
                        throw new RuntimeException("Failed to recover deleted box", e);
                    }
                });
    }
    
    /**
     * Get all inspections with edited or deleted bounding box data
     * @return List of InspectionDTOs that have bounding box changes
     */
    public List<InspectionDTO> getInspectionsWithBoundingBoxChanges() {
        return inspectionRepository.findInspectionsWithBoundingBoxChanges()
                .stream()
                .map(inspection -> modelMapper.map(inspection, InspectionDTO.class))
                .collect(Collectors.toList());
    }
    
    /**
     * Get inspections with bounding box changes for a specific transformer
     * @param transformerNo The transformer number to filter by
     * @return List of InspectionDTOs with bounding box changes for the transformer
     */
    public List<InspectionDTO> getInspectionsWithBoundingBoxChangesByTransformer(String transformerNo) {
        return inspectionRepository.findInspectionsWithBoundingBoxChangesByTransformer(transformerNo)
                .stream()
                .map(inspection -> modelMapper.map(inspection, InspectionDTO.class))
                .collect(Collectors.toList());
    }
    
    /**
     * Get bounding box details (edited and deleted) for a specific inspection
     * @param inspectionNo The inspection number
     * @return Map containing edited and deleted bounding box data
     */
    public Optional<java.util.Map<String, Object>> getBoundingBoxDetails(Long inspectionNo) {
        return inspectionRepository.findById(inspectionNo)
                .map(inspection -> {
                    java.util.Map<String, Object> result = new java.util.HashMap<>();
                    result.put("inspectionNo", inspection.getInspectionNo());
                    result.put("transformerNo", inspection.getTransformerNo());
                    result.put("dateOfInspection", inspection.getDateOfInspectionAndTime());
                    result.put("editedOrManuallyAddedBoxes", inspection.getEditedOrManuallyAddedBoxes());
                    result.put("deletedBoundingBoxes", inspection.getDeletedBoundingBoxes());
                    return result;
                });
    }
    
    /**
     * Clean up all bounding box annotations after model retraining
     * This method clears edited and deleted bounding box data for all inspections
     * @return Number of inspections updated
     */
    @org.springframework.transaction.annotation.Transactional
    public int cleanupAllBoundingBoxAnnotations() {
        return inspectionRepository.cleanupAllBoundingBoxAnnotations();
    }
    
    /**
     * Clean up bounding box annotations for a specific transformer after model retraining
     * @param transformerNo The transformer number to clean up
     * @return Number of inspections updated
     */
    @org.springframework.transaction.annotation.Transactional
    public int cleanupBoundingBoxAnnotationsByTransformer(String transformerNo) {
        return inspectionRepository.cleanupBoundingBoxAnnotationsByTransformer(transformerNo);
    }
    
    /**
     * Clean up bounding box annotations for a specific inspection
     * @param inspectionNo The inspection number to clean up
     * @return Number of inspections updated (should be 0 or 1)
     */
    @org.springframework.transaction.annotation.Transactional
    public int cleanupBoundingBoxAnnotationsById(Long inspectionNo) {
        return inspectionRepository.cleanupBoundingBoxAnnotationsById(inspectionNo);
    }
    
    /**
     * Get statistics about bounding box annotations before cleanup
     * @return Map containing counts of inspections with annotations
     */
    public java.util.Map<String, Object> getBoundingBoxAnnotationStats() {
        List<Inspection> inspectionsWithChanges = inspectionRepository.findInspectionsWithBoundingBoxChanges();
        long totalInspections = inspectionRepository.count();
        
        long withEditedBoxes = inspectionsWithChanges.stream()
                .filter(i -> i.getEditedOrManuallyAddedBoxes() != null && !i.getEditedOrManuallyAddedBoxes().trim().isEmpty())
                .count();
        
        long withDeletedBoxes = inspectionsWithChanges.stream()
                .filter(i -> i.getDeletedBoundingBoxes() != null && !i.getDeletedBoundingBoxes().trim().isEmpty())
                .count();
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalInspections", totalInspections);
        stats.put("inspectionsWithBoundingBoxChanges", inspectionsWithChanges.size());
        stats.put("inspectionsWithEditedBoxes", withEditedBoxes);
        stats.put("inspectionsWithDeletedBoxes", withDeletedBoxes);
        
        return stats;
    }
}
