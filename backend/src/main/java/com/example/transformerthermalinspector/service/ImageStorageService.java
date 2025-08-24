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
 * Manages saving, retrieving, and deleting image files in separate directories.
 */
@Service
public class ImageStorageService {
    
    @Value("${app.upload.dir.baseline:uploads/baseline}")
    private String baselineUploadDir;
    
    @Value("${app.upload.dir.maintenance:uploads/maintenance}")
    private String maintenanceUploadDir;
    
    /**
     * Initialize baseline storage directory
     */
    public void initBaseline() throws IOException {
        Path uploadPath = Paths.get(baselineUploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            System.out.println("Created baseline directory: " + uploadPath.toAbsolutePath());
        }
    }
    
    /**
     * Initialize maintenance storage directory
     */
    public void initMaintenance() throws IOException {
        Path uploadPath = Paths.get(maintenanceUploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            System.out.println("Created maintenance directory: " + uploadPath.toAbsolutePath());
        }
    }
    
    /**
     * Store baseline image file for transformer and return the filename
     * @param file The image file to store
     * @param transformerNo The transformer number for naming
     * @return The stored filename
     * @throws IOException If storage fails
     */
    public String storeBaselineImage(MultipartFile file, String transformerNo) throws IOException {
        // Initialize directory if it doesn't exist
        initBaseline();
        
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }
        
        if (!isValidImage(file)) {
            throw new IllegalArgumentException("Invalid image file");
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
        Path uploadPath = Paths.get(baselineUploadDir);
        Path filePath = uploadPath.resolve(filename);
        
        // Save file
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        System.out.println("Stored baseline image: " + filePath.toAbsolutePath());
        return filename;
    }
    
    /**
     * Store maintenance image file for inspection and return the filename
     * @param file The image file to store
     * @param inspectionNo The inspection number for naming
     * @return The stored filename
     * @throws IOException If storage fails
     */
    public String storeMaintenanceImage(MultipartFile file, Long inspectionNo) throws IOException {
        // Initialize directory if it doesn't exist
        initMaintenance();
        
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }
        
        if (!isValidImage(file)) {
            throw new IllegalArgumentException("Invalid image file");
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
        
        // Generate unique filename: INS-inspectionNo_maintenance_uniqueId.ext
        String filename = "INS-" + inspectionNo + "_maintenance_" + UUID.randomUUID().toString() + extension;
        
        // Create full path
        Path uploadPath = Paths.get(maintenanceUploadDir);
        Path filePath = uploadPath.resolve(filename);
        
        // Save file
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        System.out.println("Stored maintenance image: " + filePath.toAbsolutePath());
        return filename;
    }
    
    /**
     * Delete an image file from appropriate directory
     * @param filename The filename to delete
     * @param isBaseline True for baseline images, false for maintenance images
     * @throws IOException If deletion fails
     */
    public void deleteImage(String filename, boolean isBaseline) throws IOException {
        if (filename != null && !filename.trim().isEmpty()) {
            String directory = isBaseline ? baselineUploadDir : maintenanceUploadDir;
            Path filePath = Paths.get(directory).resolve(filename);
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
     * Legacy method - determines image type from filename pattern and deletes
     * @param filename The filename to delete
     * @throws IOException If deletion fails
     */
    public void deleteImage(String filename) throws IOException {
        if (filename != null && !filename.trim().isEmpty()) {
            // Determine image type from filename pattern
            boolean isBaseline = filename.contains("_baseline_");
            deleteImage(filename, isBaseline);
        }
    }
    
    /**
     * Get the full path to an image file
     * @param filename The filename
     * @param isBaseline True for baseline images, false for maintenance images
     * @return The full path
     */
    public Path getImagePath(String filename, boolean isBaseline) {
        String directory = isBaseline ? baselineUploadDir : maintenanceUploadDir;
        return Paths.get(directory).resolve(filename);
    }
    
    /**
     * Legacy method - determines image type from filename pattern
     * @param filename The filename
     * @return The full path
     */
    public Path getImagePath(String filename) {
        boolean isBaseline = filename.contains("_baseline_");
        return getImagePath(filename, isBaseline);
    }
    
    /**
     * Check if an image file exists
     * @param filename The filename to check
     * @param isBaseline True for baseline images, false for maintenance images
     * @return true if file exists
     */
    public boolean imageExists(String filename, boolean isBaseline) {
        if (filename == null || filename.trim().isEmpty()) {
            return false;
        }
        Path filePath = getImagePath(filename, isBaseline);
        return Files.exists(filePath) && Files.isReadable(filePath);
    }
    
    /**
     * Legacy method - determines image type from filename pattern
     * @param filename The filename to check
     * @return true if file exists
     */
    public boolean imageExists(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return false;
        }
        boolean isBaseline = filename.contains("_baseline_");
        return imageExists(filename, isBaseline);
    }
    
    /**
     * Validate image file type and size
     * @param file The file to validate
     * @return true if valid image
     */
    public boolean isValidImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }
        
        // Check file size (10MB limit)
        if (file.getSize() > 10 * 1024 * 1024) {
            return false;
        }
        
        // Check file type
        String contentType = file.getContentType();
        return contentType != null && 
               (contentType.equals("image/jpeg") || 
                contentType.equals("image/png") || 
                contentType.equals("image/gif"));
    }
}
