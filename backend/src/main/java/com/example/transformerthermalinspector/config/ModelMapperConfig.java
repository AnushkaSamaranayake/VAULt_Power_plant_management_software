package com.example.transformerthermalinspector.config;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for ModelMapper bean.
 * ModelMapper automatically converts between Entity and DTO objects.
 */
@Configuration
public class ModelMapperConfig {

    /**
     * Creates a ModelMapper bean for automatic object mapping
     * @return ModelMapper instance for Entity ↔ DTO conversion
     */
    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }
}
