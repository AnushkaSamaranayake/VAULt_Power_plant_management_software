package com.example.transformerthermalinspector.service;

import com.example.transformerthermalinspector.dao.Inspection;
import com.example.transformerthermalinspector.dto.InspectionDTO;
import com.example.transformerthermalinspector.repository.InspectionRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
     * Find inspections by current state/condition
     * @param state The state to filter by
     * @return List of inspections with the specified state
     */
    public List<InspectionDTO> getInspectionsByState(String state) {
        return inspectionRepository.findByState(state)
                .stream()
                .map(inspection -> modelMapper.map(inspection, InspectionDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Find inspections by conducting branch/department
     * @param branch The branch to filter by
     * @return List of inspections conducted by the specified branch
     */
    public List<InspectionDTO> getInspectionsByBranch(String branch) {
        return inspectionRepository.findByBranch(branch)
                .stream()
                .map(inspection -> modelMapper.map(inspection, InspectionDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Get inspections for a transformer ordered by date (newest first)
     * @param transformerNo The transformer number to filter by
     * @return List of inspections ordered by date descending
     */
    public List<InspectionDTO> getInspectionsByTransformerNoOrderByDate(String transformerNo) {
        return inspectionRepository.findByTransformerNoOrderByDateDesc(transformerNo)
                .stream()
                .map(inspection -> modelMapper.map(inspection, InspectionDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Find inspections within a specific date range
     * @param startDate The start of the date range
     * @param endDate The end of the date range
     * @return List of inspections within the date range
     */
    public List<InspectionDTO> getInspectionsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return inspectionRepository.findByDateRange(startDate, endDate)
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
                        if (weather != null && !weather.trim().isEmpty()) {
                            inspection.setWeather(weather.trim());
                        }
                        
                        Inspection savedInspection = inspectionRepository.save(inspection);
                        System.out.println("InspectionService - Maintenance image uploaded successfully: " + filename);
                        return modelMapper.map(savedInspection, InspectionDTO.class);
                    } catch (IOException e) {
                        System.err.println("Failed to upload maintenance image for inspection: " + inspectionNo);
                        e.printStackTrace();
                        throw new RuntimeException("Failed to upload maintenance image", e);
                    }
                });
    }
}
