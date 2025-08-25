package com.example.transformerthermalinspector.dao;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List; 

/**
 * Entity representing a transformer in the power plant management system.
 * Maps to the 'transformer' table in PostgreSQL database.
 */

@Entity
@Table(name = "transformer")
@Data // Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor // Default constructor
@AllArgsConstructor // Constructor with all fields
public class Transformer {

    // Primary key - user-provided transformer number
    @Id
    @Column(name = "transformer_no", nullable = false)
    private String transformerNo;

    // Geographic region where transformer is located - REQUIRED at creation
    @Column(name = "region", nullable = false)
    private String region;

    // Pole number identifier - REQUIRED at creation
    @Column(name = "pole_no", nullable = false)
    private String poleNo;

    // Type/category of transformer - REQUIRED at creation
    @Column(name = "type", nullable = false)
    private String type;

    // Detailed location information - REQUIRED at creation
    @Column(name = "location_details", columnDefinition = "TEXT", nullable = false)
    private String locationDetails;

    // File path to baseline image - CAN BE NULL (added later)
    @Column(name = "baseline_image_path", nullable = true)
    private String baselineImagePath;

    // When baseline image was uploaded - CAN BE NULL (added later)
    @Column(name = "baseline_image_upload_date_and_time", nullable = true)
    private LocalDateTime baselineImageUploadDateAndTime;

    // Weather conditions during baseline capture - CAN BE NULL (added later)
    @Column(name = "weather", nullable = true)
    private String weather;

    // Capacity of the transformer (e.g., "100 kVA", "500 MVA") - CAN BE NULL
    @Column(name = "capacity", nullable = true)
    private String capacity;

    // Number of feeders connected to the transformer - CAN BE NULL
    @Column(name = "number_of_feeders", nullable = true)
    private Integer numberOfFeeders;

    // One transformer can have many inspections
    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<com.example.transformerthermalinspector.dao.Inspection> inspections;
}