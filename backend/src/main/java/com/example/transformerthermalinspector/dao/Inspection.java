package com.example.transformerthermalinspector.dao;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.example.transformerthermalinspector.dao.Transformer;

/**
 * Entity representing a transformer inspection record.
 * Maps to the 'inspection' table in PostgreSQL database.
 */
@Entity
@Table(name = "inspection")
@Data // Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor // Default constructor
@AllArgsConstructor // Constructor with all fields
public class Inspection {

    // Primary key - auto-generated inspection number
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inspection_no", nullable = false)
    private Long inspectionNo;

    // Branch conducting inspection - REQUIRED at creation
    @Column(name = "branch", nullable = false)
    private String branch;

    // File path to maintenance/inspection image - CAN BE NULL (added later)
    @Column(name = "maintenance_image_path", nullable = true)
    private String maintenanceImagePath;

    // Foreign key to transformer table - REQUIRED at creation
    @Column(name = "transformer_no", nullable = false)
    private String transformerNo;

    // When inspection was conducted - REQUIRED at creation
    @Column(name = "date_of_inspection_and_time", nullable = false)
    private LocalDateTime dateOfInspectionAndTime;

    // Current status of the inspection AND AI analysis status - CAN BE NULL (determined later)
    // Values: "Pending", "In progress", "Completed" for inspection status
    // OR: "pending", "completed", "failed" for AI analysis status
    @Column(name = "state", nullable = true)
    private String state;

    // When maintenance image was uploaded - CAN BE NULL (added later)
    @Column(name = "maintenance_image_upload_date_and_time", nullable = true)
    private LocalDateTime maintenanceImageUploadDateAndTime;

    // Weather conditions during inspection - CAN BE NULL (recorded later)
    @Column(name = "weather", nullable = true)
    private String weather;

    // AI analysis results - bounding box coordinates from YOLO model - CAN BE NULL (analyzed later)
    @Column(name = "ai_bounding_boxes", columnDefinition = "TEXT", nullable = true)
    private String aiBoundingBoxes; // Stored as JSON string

    // Many inspections belong to one transformer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_no", referencedColumnName = "transformer_no", insertable = false, updatable = false)
    private Transformer transformer;
}
