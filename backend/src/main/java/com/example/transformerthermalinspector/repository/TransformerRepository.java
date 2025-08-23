package com.example.transformerthermalinspector.repository;

import com.example.transformerthermalinspector.dao.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for Transformer entity.
 * Provides CRUD operations and custom queries for transformer data.
 */
@Repository
public interface TransformerRepository extends JpaRepository<Transformer, String> {
    
    // Find transformers by geographic region
    List<Transformer> findByRegion(String region);
    
    // Find transformers by type/category
    List<Transformer> findByType(String type);
    
    // Custom query to find transformers by both region and type
    @Query("SELECT t FROM Transformer t WHERE t.region = :region AND t.type = :type")
    List<Transformer> findByRegionAndType(@Param("region") String region, @Param("type") String type);
}
