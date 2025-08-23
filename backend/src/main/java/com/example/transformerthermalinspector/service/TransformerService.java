package com.example.transformerthermalinspector.service;

import com.example.transformerthermalinspector.dao.Transformer;
import com.example.transformerthermalinspector.dto.TransformerDTO;
import com.example.transformerthermalinspector.repository.TransformerRepository;
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
 * Service class for Transformer-related business logic.
 * Handles CRUD operations and converts between Entity and DTO.
 */
@Service
@RequiredArgsConstructor // Generates constructor for final fields (dependency injection)
public class TransformerService {

    private final TransformerRepository transformerRepository;
    private final ModelMapper modelMapper; // For Entity ↔ DTO conversion
    private final ImageStorageService imageStorageService;

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
     * Also deletes associated baseline image file
     * @param transformerNo The transformer number to delete
     * @return true if deleted successfully, false if not found
     */
    public boolean deleteTransformer(String transformerNo) {
        // Find transformer first to get baseline image path
        Optional<Transformer> transformerOpt = transformerRepository.findById(transformerNo);
        
        if (transformerOpt.isPresent()) {
            Transformer transformer = transformerOpt.get();
            
            System.out.println("Deleting transformer: " + transformerNo);
            System.out.println("Baseline image path: " + transformer.getBaselineImagePath());
            
            // Delete baseline image file if exists
            if (transformer.getBaselineImagePath() != null && !transformer.getBaselineImagePath().trim().isEmpty()) {
                try {
                    System.out.println("Attempting to delete image file: " + transformer.getBaselineImagePath());
                    imageStorageService.deleteImage(transformer.getBaselineImagePath());
                    System.out.println("Successfully deleted baseline image: " + transformer.getBaselineImagePath());
                } catch (IOException e) {
                    // Log warning but don't fail the deletion - database cleanup is more important
                    System.err.println("Warning: Could not delete baseline image file '" + 
                                     transformer.getBaselineImagePath() + "': " + e.getMessage());
                    e.printStackTrace();
                } catch (Exception e) {
                    System.err.println("Unexpected error deleting image: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.out.println("No baseline image to delete");
            }
            
            // Delete transformer from database
            transformerRepository.deleteById(transformerNo);
            System.out.println("Deleted transformer from database: " + transformerNo);
            return true;
        }
        
        System.out.println("Transformer not found: " + transformerNo);
        return false; // Transformer not found
    }

    /**
     * Check if a transformer exists by transformer number
     * @param transformerNo The transformer number to check
     * @return true if exists, false otherwise
     */
    public boolean existsByTransformerNo(String transformerNo) {
        return transformerRepository.existsById(transformerNo);
    }

    /**
     * Upload baseline image for a transformer
     * @param transformerNo The transformer number
     * @param imageFile The image file to upload
     * @param weather The weather conditions (optional)
     * @return Updated TransformerDTO
     * @throws RuntimeException if transformer not found
     * @throws IOException if file storage fails
     */
    public TransformerDTO uploadBaselineImage(String transformerNo, MultipartFile imageFile, String weather) 
            throws IOException {
        
        // Find transformer
        Optional<Transformer> transformerOpt = transformerRepository.findById(transformerNo);
        if (transformerOpt.isEmpty()) {
            throw new RuntimeException("Transformer not found with number: " + transformerNo);
        }
        
        Transformer transformer = transformerOpt.get();
        
        // Delete old image if exists
        if (transformer.getBaselineImagePath() != null) {
            try {
                imageStorageService.deleteImage(transformer.getBaselineImagePath());
            } catch (IOException e) {
                // Log warning but continue - don't fail the upload for cleanup issues
                System.err.println("Warning: Could not delete old image: " + e.getMessage());
            }
        }
        
        // Store new image
        String imagePath = imageStorageService.storeBaselineImage(imageFile, transformerNo);
        
        // Update transformer
        transformer.setBaselineImagePath(imagePath);
        transformer.setWeather(weather);
        transformer.setBaselineImageUploadDateAndTime(LocalDateTime.now());
        
        // Save and return
        Transformer savedTransformer = transformerRepository.save(transformer);
        return modelMapper.map(savedTransformer, TransformerDTO.class);
    }
}
