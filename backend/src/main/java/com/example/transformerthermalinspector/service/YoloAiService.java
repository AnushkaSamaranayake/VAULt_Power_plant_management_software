package com.example.transformerthermalinspector.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Service for communicating with YOLO FastAPI for thermal anomaly detection.
 */
@Service
@RequiredArgsConstructor
public class YoloAiService {

    private static final String YOLO_API_URL = "http://localhost:5000/inference";
    private static final double DEFAULT_CONFIDENCE_THRESHOLD = 0.50;
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Send image to YOLO API for inference and get bounding box predictions using a MultipartFile
     */
    public String analyzeImage(MultipartFile file, double confidenceThreshold) throws IOException {
        return analyzeImage(file.getBytes(), file.getOriginalFilename(), confidenceThreshold);
    }

    /**
     * Send image bytes to YOLO API for inference and get bounding box predictions.
     * Prefer this in async contexts to avoid using MultipartFile outside the request thread.
     * @param bytes Image bytes to analyze
     * @param originalFilename Original filename (for content disposition); can be null
     * @param confidenceThreshold Confidence threshold for predictions (0-1)
     * @return JSON string containing predictions with bounding boxes
     * @throws IOException if analysis fails
     */
    public String analyzeImage(byte[] bytes, String originalFilename, double confidenceThreshold) throws IOException {
        try {
            // Prepare multipart request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            // Add file as ByteArrayResource to avoid file system dependencies
            final String filename = (originalFilename != null && !originalFilename.isBlank()) ? originalFilename : "image.jpg";
            ByteArrayResource fileResource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };

            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            // Make API call to YOLO service
            String url = YOLO_API_URL + "?conf_threshold=" + confidenceThreshold;
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // Validate and format the response
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                return objectMapper.writeValueAsString(jsonResponse);
            } else {
                throw new IOException("YOLO API returned non-OK status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            System.err.println("Failed to analyze image with YOLO API: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("AI analysis failed: " + e.getMessage(), e);
        }
    }

    /**
     * Analyze image with default confidence threshold
     * @param file The image file to analyze
     * @return JSON string containing predictions with bounding boxes
     * @throws IOException if analysis fails
     */
    public String analyzeImage(MultipartFile file) throws IOException {
        return analyzeImage(file, DEFAULT_CONFIDENCE_THRESHOLD);
    }

    /**
     * Analyze image bytes with default confidence threshold
     */
    public String analyzeImage(byte[] bytes, String originalFilename) throws IOException {
        return analyzeImage(bytes, originalFilename, DEFAULT_CONFIDENCE_THRESHOLD);
    }

    /**
     * Check if YOLO API is available
     * @return true if API is reachable, false otherwise
     */
    public boolean isYoloApiAvailable() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                "http://localhost:5000/",
                String.class
            );
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            return false;
        }
    }
}
