package com.example.transformerthermalinspector.repository;

import com.example.transformerthermalinspector.dao.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;
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
    
    // Find transformers by capacity
    List<Transformer> findByCapacity(String capacity);
    
    // Find transformers by number of feeders
    List<Transformer> findByNumberOfFeeders(Integer numberOfFeeders);
}
