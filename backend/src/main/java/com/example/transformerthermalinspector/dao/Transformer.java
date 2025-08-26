package com.example.transformerthermalinspector.dao;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.example.transformerthermalinspector.dao.Inspection; 

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

    // Base64 encoded baseline image - CAN BE NULL (added later)
    @Column(name = "baseline_image", columnDefinition = "TEXT", nullable = true)
    private String baselineImage;

    // When baseline image was uploaded - CAN BE NULL (added later)
    @Column(name = "baseline_image_upload_date_and_time", nullable = true)
    private LocalDateTime baselineImageUploadDateAndTime;

    // Weather conditions during baseline capture - CAN BE NULL (added later)
    @Column(name = "weather", nullable = true)
    private String weather;

    // One transformer can have many inspections
    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Inspection> inspections;
}