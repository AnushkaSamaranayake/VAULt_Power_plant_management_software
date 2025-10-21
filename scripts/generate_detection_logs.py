"""
AI Thermal Anomaly Detection - Log Generator
Generates detection metadata logs for at least 5 images for project submission

Requirements:
- YOLO API running on http://localhost:5000
- At least 5 thermal images in backend/uploads/maintenance/
"""

import requests
import json
from pathlib import Path
from datetime import datetime
import sys

# Configuration
YOLO_API_URL = "http://localhost:5000/inference"
CONFIDENCE_THRESHOLD = 0.5
IMAGE_FOLDER = Path("backend/uploads/maintenance")
OUTPUT_JSON = "detection_logs_report.json"
OUTPUT_TXT = "detection_logs_report.txt"

# Class mappings
CLASS_MAP = {0: "Faulty", 1: "Normal", 2: "Potentially Faulty"}
SEVERITY_MAP = {0: "Critical", 1: "Normal", 2: "Warning"}
SEVERITY_COLOR = {0: "🔴", 1: "🟢", 2: "🟡"}


def analyze_image(image_path):
    """Send image to YOLO API and get predictions"""
    print(f"  → Sending to YOLO API...", end=" ")
    try:
        with open(image_path, 'rb') as img_file:
            files = {'file': img_file}
            params = {'conf_threshold': CONFIDENCE_THRESHOLD}
            response = requests.post(YOLO_API_URL, files=files, params=params)
            response.raise_for_status()
            print("✓")
            return response.json()
    except requests.exceptions.ConnectionError:
        print("✗ (YOLO API not running)")
        raise Exception("YOLO API is not accessible. Please start it with: cd yolo-api && uvicorn app.main:app --reload")
    except Exception as e:
        print(f"✗ ({str(e)})")
        raise


def generate_metadata(image_path, predictions):
    """Generate detailed metadata for each detection"""
    metadata = {
        "image_name": image_path.name,
        "image_path": str(image_path),
        "analysis_timestamp": datetime.now().isoformat(),
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "total_detections": len(predictions.get('predictions', [])),
        "detections": []
    }
    
    for idx, pred in enumerate(predictions.get('predictions', []), 1):
        box = pred['box']
        
        # Calculate additional metrics
        width = box[2] - box[0]
        height = box[3] - box[1]
        area = width * height
        center_x = (box[0] + box[2]) / 2
        center_y = (box[1] + box[3]) / 2
        
        detection = {
            "error_number": idx,
            "class_id": pred['class'],
            "class_name": CLASS_MAP.get(pred['class'], "Unknown"),
            "severity": SEVERITY_MAP.get(pred['class'], "Unknown"),
            "confidence_score": round(pred['confidence'], 4),
            "confidence_percentage": round(pred['confidence'] * 100, 2),
            "bounding_box": {
                "coordinates": {
                    "x1": round(box[0], 2),
                    "y1": round(box[1], 2),
                    "x2": round(box[2], 2),
                    "y2": round(box[3], 2)
                },
                "top_left": {"x": round(box[0], 2), "y": round(box[1], 2)},
                "bottom_right": {"x": round(box[2], 2), "y": round(box[3], 2)},
                "center": {"x": round(center_x, 2), "y": round(center_y, 2)}
            },
            "dimensions": {
                "width_px": round(width, 2),
                "height_px": round(height, 2),
                "area_px": round(area, 2)
            }
        }
        metadata["detections"].append(detection)
    
    return metadata


def generate_text_report(all_logs):
    """Generate a human-readable text report"""
    report = []
    report.append("=" * 80)
    report.append("AI THERMAL ANOMALY DETECTION - METADATA REPORT")
    report.append("=" * 80)
    report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"Model: YOLOv8 Custom Trained")
    report.append(f"Confidence Threshold: {CONFIDENCE_THRESHOLD}")
    report.append(f"Total Images Analyzed: {len(all_logs)}")
    report.append(f"Total Detections: {sum(log['total_detections'] for log in all_logs)}")
    report.append("=" * 80)
    report.append("")
    
    for idx, log in enumerate(all_logs, 1):
        report.append(f"\n{'=' * 80}")
        report.append(f"IMAGE {idx}: {log['image_name']}")
        report.append(f"{'=' * 80}")
        report.append(f"Path: {log['image_path']}")
        report.append(f"Analysis Time: {log['analysis_timestamp']}")
        report.append(f"Total Detections: {log['total_detections']}")
        report.append("-" * 80)
        
        if log['total_detections'] == 0:
            report.append("  ✓ No anomalies detected - Transformer appears normal")
        else:
            for detection in log['detections']:
                severity_icon = SEVERITY_COLOR.get(detection['class_id'], "⚪")
                report.append(f"\n  {severity_icon} ERROR #{detection['error_number']}")
                report.append(f"  Class: {detection['class_name']} (ID: {detection['class_id']})")
                report.append(f"  Severity: {detection['severity']}")
                report.append(f"  Confidence: {detection['confidence_percentage']}% ({detection['confidence_score']})")
                report.append(f"  ")
                report.append(f"  Bounding Box Coordinates:")
                report.append(f"    - Top-Left: ({detection['bounding_box']['coordinates']['x1']}, {detection['bounding_box']['coordinates']['y1']})")
                report.append(f"    - Bottom-Right: ({detection['bounding_box']['coordinates']['x2']}, {detection['bounding_box']['coordinates']['y2']})")
                report.append(f"    - Center: ({detection['bounding_box']['center']['x']}, {detection['bounding_box']['center']['y']})")
                report.append(f"  ")
                report.append(f"  Anomaly Dimensions:")
                report.append(f"    - Width: {detection['dimensions']['width_px']} pixels")
                report.append(f"    - Height: {detection['dimensions']['height_px']} pixels")
                report.append(f"    - Area: {detection['dimensions']['area_px']} square pixels")
                report.append(f"  {'-' * 76}")
    
    report.append("\n" + "=" * 80)
    report.append("END OF REPORT")
    report.append("=" * 80)
    
    return "\n".join(report)


def main():
    """Process 5 images and generate detection logs"""
    print("\n" + "=" * 80)
    print("AI THERMAL ANOMALY DETECTION - LOG GENERATOR")
    print("=" * 80)
    print(f"Starting log generation at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Looking for images in: {IMAGE_FOLDER.absolute()}")
    print("")
    
    # Check if folder exists
    if not IMAGE_FOLDER.exists():
        print(f"❌ Error: Image folder not found: {IMAGE_FOLDER.absolute()}")
        print(f"Please ensure maintenance images are in the correct location.")
        sys.exit(1)
    
    # Get all maintenance images (both .jpg and .jpeg)
    jpg_files = list(IMAGE_FOLDER.glob("*.jpg"))
    jpeg_files = list(IMAGE_FOLDER.glob("*.jpeg"))
    image_files = sorted(jpg_files + jpeg_files)
    
    if len(image_files) == 0:
        print(f"❌ Error: No images found in {IMAGE_FOLDER.absolute()}")
        print(f"Please add thermal images (.jpg or .jpeg) to this folder before running the script.")
        sys.exit(1)
    
    print(f"Found {len(image_files)} image(s)")
    
    # Select at least 5 images (or all available if less than 5)
    images_to_process = image_files[:min(5, len(image_files))]
    
    if len(images_to_process) < 5:
        print(f"⚠️  Warning: Only {len(images_to_process)} images available (need 5 for submission)")
        print(f"Processing available images...")
    else:
        print(f"Processing first 5 images for submission")
    
    print("")
    
    # Process each image
    all_logs = []
    failed_images = []
    
    for idx, image_path in enumerate(images_to_process, 1):
        print(f"[{idx}/{len(images_to_process)}] Processing: {image_path.name}")
        try:
            predictions = analyze_image(image_path)
            metadata = generate_metadata(image_path, predictions)
            all_logs.append(metadata)
            print(f"  ✓ Found {metadata['total_detections']} detection(s)")
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            failed_images.append(image_path.name)
    
    print("")
    
    if len(all_logs) == 0:
        print("❌ No images were successfully processed. Cannot generate report.")
        sys.exit(1)
    
    # Generate JSON report
    json_output = {
        "report_metadata": {
            "title": "AI Thermal Anomaly Detection - Metadata Report",
            "generated_at": datetime.now().isoformat(),
            "total_images_analyzed": len(all_logs),
            "total_detections": sum(log['total_detections'] for log in all_logs),
            "failed_images": len(failed_images)
        },
        "model_info": {
            "name": "YOLOv8 Custom Trained",
            "confidence_threshold": CONFIDENCE_THRESHOLD,
            "class_mappings": CLASS_MAP,
            "severity_mappings": SEVERITY_MAP
        },
        "results": all_logs
    }
    
    # Save JSON file
    output_json_path = Path(OUTPUT_JSON)
    with open(output_json_path, 'w') as f:
        json.dump(json_output, f, indent=2)
    
    # Generate and save text report
    text_report = generate_text_report(all_logs)
    output_txt_path = Path(OUTPUT_TXT)
    with open(output_txt_path, 'w') as f:
        f.write(text_report)
    
    # Print summary
    print("=" * 80)
    print("GENERATION COMPLETE!")
    print("=" * 80)
    print(f"✓ JSON Report saved to: {output_json_path.absolute()}")
    print(f"✓ Text Report saved to: {output_txt_path.absolute()}")
    print("")
    print(f"Summary:")
    print(f"  - Images processed: {len(all_logs)}")
    print(f"  - Total detections: {sum(log['total_detections'] for log in all_logs)}")
    print(f"  - Failed images: {len(failed_images)}")
    
    if failed_images:
        print(f"\nFailed images:")
        for img in failed_images:
            print(f"  - {img}")
    
    print("\n📄 You can now submit these files with your project:")
    print(f"   1. {OUTPUT_JSON}")
    print(f"   2. {OUTPUT_TXT}")
    print("=" * 80)
    print("")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Script interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        sys.exit(1)
