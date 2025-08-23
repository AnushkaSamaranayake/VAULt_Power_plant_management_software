package com.example.transformerthermalinspector.repository;

import com.example.transformerthermalinspector.dao.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for Inspection entity.
 * Provides CRUD operations and custom queries for inspection data.
 */
@Repository
public interface InspectionRepository extends JpaRepository<Inspection, String> {
    
    // Find all inspections for a specific transformer
    List<Inspection> findByTransformerNo(String transformerNo);
    
    // Find inspections by current state/condition
    List<Inspection> findByState(String state);
    
    // Find inspections by conducting branch/department
    List<Inspection> findByBranch(String branch);
    
    // Get inspections for a transformer ordered by date (newest first)
    @Query("SELECT i FROM Inspection i WHERE i.transformerNo = :transformerNo ORDER BY i.dateOfInspectionAndTime DESC")
    List<Inspection> findByTransformerNoOrderByDateDesc(@Param("transformerNo") String transformerNo);
    
    // Find inspections within a date range
    @Query("SELECT i FROM Inspection i WHERE i.dateOfInspectionAndTime BETWEEN :startDate AND :endDate")
    List<Inspection> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Find inspections for a specific transformer within a date range
    @Query("SELECT i FROM Inspection i WHERE i.transformerNo = :transformerNo AND i.dateOfInspectionAndTime BETWEEN :startDate AND :endDate")
    List<Inspection> findByTransformerNoAndDateRange(@Param("transformerNo") String transformerNo, 
                                                   @Param("startDate") LocalDateTime startDate, 
                                                   @Param("endDate") LocalDateTime endDate);
}
