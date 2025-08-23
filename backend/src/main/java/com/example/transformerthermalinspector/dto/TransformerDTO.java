package com.example.transformerthermalinspector.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for Transformer entity.
 * Used for API requests/responses to avoid exposing entity directly.
 */
@Data // Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor // Default constructor for JSON deserialization
@AllArgsConstructor // Constructor with all fields
public class TransformerDTO {
    
    @NotBlank(message = "Transformer number is required")
    private String transformerNo; // Primary key
    
    @NotBlank(message = "Region is required")
    private String region; // Geographic region
    
    @NotBlank(message = "Pole number is required")
    private String poleNo; // Pole identifier
    
    @NotBlank(message = "Type is required")
    private String type; // Transformer type/category
    
    @NotBlank(message = "Location details are required")
    private String locationDetails; // Detailed location info
    
    private String baselineImagePath; // File path to baseline image (optional)
    private LocalDateTime baselineImageUploadDateAndTime; // Upload timestamp (optional)
    private String weather; // Weather conditions (optional)
    
    // Computed property to provide image URL for frontend
    @JsonProperty("baselineImageUrl")
    public String getBaselineImageUrl() {
        return baselineImagePath != null ? "/api/transformers/images/" + baselineImagePath : null;
    }
}
