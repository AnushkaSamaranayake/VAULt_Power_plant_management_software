package com.example.transformerthermalinspector.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for Inspection entity.
 * Used for API requests/responses to avoid exposing entity directly.
 */
@Data // Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor // Default constructor for JSON deserialization
@AllArgsConstructor // Constructor with all fields
public class InspectionDTO {
    
    private Long inspectionNo; // Primary key (auto-generated, not required for creation)
    
    @NotBlank(message = "Branch is required")
    private String branch; // Department conducting inspection
    
    private String maintenanceImagePath; // File path to maintenance inspection image (optional)
    
    @NotBlank(message = "Transformer number is required")
    private String transformerNo; // Foreign key to transformer
    
    @NotNull(message = "Date of inspection is required")
    private LocalDateTime dateOfInspectionAndTime; // Inspection timestamp
    
    private String state; // status of the inspection
    private LocalDateTime maintenanceImageUploadDateAndTime; // Image upload timestamp
    private String weather; // Weather conditions during inspection
    
    // Computed property to provide maintenance image URL for frontend
    @JsonProperty("maintenanceImageUrl")
    public String getMaintenanceImageUrl() {
        return maintenanceImagePath != null ? "/api/inspections/images/" + maintenanceImagePath : null;
    }
}
