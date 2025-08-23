package com.example.transformerthermalinspector.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Service for handling image file storage operations.
 * Manages saving, retrieving, and deleting image files.
 */
@Service
public class ImageStorageService {
    
    @Value("${app.upload.dir:uploads/images}")
    private String uploadDir;
    
    /**
     * Initialize storage directory
     */
    public void init() throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
    }
    
    /**
     * Store image file and return the filename
     * @param file The image file to store
     * @param transformerNo The transformer number for naming
     * @return The stored filename
     * @throws IOException If storage fails
     */
    public String storeBaselineImage(MultipartFile file, String transformerNo) throws IOException {
        // Initialize directory if it doesn't exist
        init();
        
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }
        
        // Get original filename and extension
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        if (originalFilename.contains("..")) {
            throw new IllegalArgumentException("Invalid filename: " + originalFilename);
        }
        
        // Extract file extension
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf(".");
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }
        
        // Generate unique filename: transformerNo_baseline_uniqueId.ext
        String filename = transformerNo + "_baseline_" + UUID.randomUUID().toString() + extension;
        
        // Create full path
        Path uploadPath = Paths.get(uploadDir);
        Path filePath = uploadPath.resolve(filename);
        
        // Save file
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        return filename;
    }
    
    /**
     * Delete an image file
     * @param filename The filename to delete
     * @throws IOException If deletion fails
     */
    public void deleteImage(String filename) throws IOException {
        if (filename != null && !filename.trim().isEmpty()) {
            Path filePath = Paths.get(uploadDir).resolve(filename);
            System.out.println("ImageStorageService - Attempting to delete: " + filePath.toAbsolutePath());
            System.out.println("File exists before deletion: " + Files.exists(filePath));
            
            boolean deleted = Files.deleteIfExists(filePath);
            System.out.println("File deletion result: " + deleted);
            
            if (Files.exists(filePath)) {
                throw new IOException("File still exists after deletion attempt: " + filePath);
            }
            
            System.out.println("File successfully deleted: " + filename);
        } else {
            System.out.println("ImageStorageService - No filename provided for deletion");
        }
    }
    
    /**
     * Get the full path to an image file
     * @param filename The filename
     * @return The full path
     */
    public Path getImagePath(String filename) {
        return Paths.get(uploadDir).resolve(filename);
    }
    
    /**
     * Check if an image file exists
     * @param filename The filename to check
     * @return true if file exists
     */
    public boolean imageExists(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return false;
        }
        Path filePath = Paths.get(uploadDir).resolve(filename);
        return Files.exists(filePath) && Files.isReadable(filePath);
    }
}
