package com.example.transformerthermalinspector.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for updating user annotations on bounding boxes.
 * The JSON strings should contain arrays of items with fields:
 * - type: added | edited | deleted
 * - comment: optional string
 * - timestamp: ISO string
 * - userId: string
 * - box: [x1, y1, x2, y2]
 * - originalBox: [x1, y1, x2, y2] (only for edited)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationUpdateRequest {
    private String editedOrManuallyAddedBoxes; // JSON string (array or object)
    private String deletedBoundingBoxes; // JSON string (array or object)
}
