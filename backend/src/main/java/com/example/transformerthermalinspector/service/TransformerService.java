package com.example.transformerthermalinspector.service;

import com.example.transformerthermalinspector.dao.Transformer;
import com.example.transformerthermalinspector.dto.TransformerDTO;
import com.example.transformerthermalinspector.repository.TransformerRepository;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service class for Transformer-related business logic.
 * Handles CRUD operations and converts between Entity and DTO.
 */
@Service
@RequiredArgsConstructor // Generates constructor for final fields (dependency injection)
public class TransformerService {

    private final TransformerRepository transformerRepository;
    private final ModelMapper modelMapper; // For Entity ↔ DTO conversion

    /**
     * Retrieve all transformers from database
     * @return List of TransformerDTOs
     */
    public List<TransformerDTO> getAllTransformers() {
        return transformerRepository.findAll()
                .stream()
                .map(transformer -> modelMapper.map(transformer, TransformerDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Find transformer by transformer number (primary key)
     * @param transformerNo The transformer number to search for
     * @return Optional TransformerDTO if found
     */
    public Optional<TransformerDTO> getTransformerById(String transformerNo) {
        return transformerRepository.findById(transformerNo)
                .map(transformer -> modelMapper.map(transformer, TransformerDTO.class));
    }

    /**
     * Alternative method name for getting transformer by number
     * @param transformerNo The transformer number to search for
     * @return Optional TransformerDTO if found
     */
    public Optional<TransformerDTO> getTransformerByTransformerNo(String transformerNo) {
        return transformerRepository.findById(transformerNo)
                .map(transformer -> modelMapper.map(transformer, TransformerDTO.class));
    }

    /**
     * Find transformers by geographic region
     * @param region The region to filter by
     * @return List of transformers in the specified region
     */
    public List<TransformerDTO> getTransformersByRegion(String region) {
        return transformerRepository.findByRegion(region)
                .stream()
                .map(transformer -> modelMapper.map(transformer, TransformerDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Find transformers by type/category
     * @param type The type to filter by
     * @return List of transformers of the specified type
     */
    public List<TransformerDTO> getTransformersByType(String type) {
        return transformerRepository.findByType(type)
                .stream()
                .map(transformer -> modelMapper.map(transformer, TransformerDTO.class))
                .collect(Collectors.toList());
    }

    /**
     * Save a new transformer to the database
     * @param transformerDTO The transformer data to save
     * @return Saved TransformerDTO with any generated fields
     */
    public TransformerDTO saveTransformer(TransformerDTO transformerDTO) {
        Transformer transformer = modelMapper.map(transformerDTO, Transformer.class);
        Transformer savedTransformer = transformerRepository.save(transformer);
        return modelMapper.map(savedTransformer, TransformerDTO.class);
    }

    /**
     * Update an existing transformer
     * @param transformerNo The transformer number to update
     * @param transformerDTO The updated transformer data
     * @return Updated TransformerDTO if found, empty Optional otherwise
     */
    public Optional<TransformerDTO> updateTransformer(String transformerNo, TransformerDTO transformerDTO) {
        return transformerRepository.findById(transformerNo)
                .map(existingTransformer -> {
                    modelMapper.map(transformerDTO, existingTransformer);
                    existingTransformer.setTransformerNo(transformerNo); // Ensure ID remains unchanged
                    Transformer savedTransformer = transformerRepository.save(existingTransformer);
                    return modelMapper.map(savedTransformer, TransformerDTO.class);
                });
    }

    /**
     * Delete a transformer by transformer number
     * @param transformerNo The transformer number to delete
     * @return true if deleted successfully, false if not found
     */
    public boolean deleteTransformer(String transformerNo) {
        if (transformerRepository.existsById(transformerNo)) {
            transformerRepository.deleteById(transformerNo);
            return true;
        }
        return false;
    }

    /**
     * Check if a transformer exists by transformer number
     * @param transformerNo The transformer number to check
     * @return true if exists, false otherwise
     */
    public boolean existsByTransformerNo(String transformerNo) {
        return transformerRepository.existsById(transformerNo);
    }
}
