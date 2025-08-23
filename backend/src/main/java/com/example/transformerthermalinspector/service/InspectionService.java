package com.example.transformerthermalinspector.service;

import com.example.transformerthermalinspector.dao.Inspection;
import com.example.transformerthermalinspector.dto.InspectionDTO;
import com.example.transformerthermalinspector.repository.InspectionRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

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
    public Optional<InspectionDTO> getInspectionById(String inspectionNo) {
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
    public Optional<InspectionDTO> updateInspection(String inspectionNo, InspectionDTO inspectionDTO) {
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
    public boolean deleteInspection(String inspectionNo) {
        if (inspectionRepository.existsById(inspectionNo)) {
            inspectionRepository.deleteById(inspectionNo);
            return true;
        }
        return false;
    }
}
