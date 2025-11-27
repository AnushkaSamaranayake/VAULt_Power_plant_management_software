package com.example.transformerthermalinspector.repository;

import com.example.transformerthermalinspector.dao.InspectionReportForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for InspectionReportForm entity.
 */
@Repository
public interface InspectionReportFormRepository extends JpaRepository<InspectionReportForm, Long> {
    
    /**
     * Find inspection report form by inspection number.
     * @param inspectionNo the inspection number
     * @return Optional containing the report form if found
     */
    Optional<InspectionReportForm> findByInspectionNo(Long inspectionNo);
    
    /**
     * Check if a report form exists for a given inspection number.
     * @param inspectionNo the inspection number
     * @return true if exists, false otherwise
     */
    boolean existsByInspectionNo(Long inspectionNo);
    
    /**
     * Delete inspection report form by inspection number.
     * @param inspectionNo the inspection number
     */
    void deleteByInspectionNo(Long inspectionNo);
}
