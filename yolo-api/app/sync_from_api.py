import requests
import os
import json
import cv2 as cv

API_URL = "http://localhost:8080/api/inspections/bounding-box-changes"
IMAGE_BASE_URL = "http://localhost:8080"
DATASET_DIR = "dataset/train"
CLASSES = ["Faulty", "Normal", "Potentially Faulty"]

def download_image(image_url, save_path):
    r = requests.get(image_url, stream=True)
    if r.status_code == 200:
        with open(save_path, 'wb') as f:
            for chunk in r.iter_content(1024):
                f.write(chunk)
        
        return True
    print(f"Failed to download image from {image_url}. Status code: {r.status_code}")
    return False

def convert_to_yolo(edited_boxes, image_path, label_path):
    img = cv.imread(image_path)
    if img is None:
        print(f"Failed to read image {image_path}")
        return False
    
    h,w = img.shape[:2]
    lines = []
    for box_data in edited_boxes:
        x1, y1, x2, y2 = box_data['box']
        cls = box_data['class']

        x_center = ((x1 + x2) / 2) / w
        y_center = ((y1 + y2) / 2) / h
        bw = (x2 - x1) / w
        bh = (y2 - y1)/h
        lines.append(f"{cls} {x_center:.6f} {y_center:.6f} {bw:.6f} {bh:.6f}")

    with open(label_path, 'w') as f:
        f.write("\n".join(lines))
    return True

def sync_from_api():
    os.makedirs(f'{DATASET_DIR}/images', exist_ok=True)
    os.makedirs(f'{DATASET_DIR}/labels', exist_ok=True)

    res = requests.get(API_URL)
    data = res.json()
    processed = 0

    for record in data:
        if not record["editedOrManuallyAddedBoxes"] or record["editedOrManuallyAddedBoxes"] == "[]":
            continue

        try:
            boxes = json.loads(record["editedOrManuallyAddedBoxes"])
        except json.JSONDecodeError:
            print(f"Invalid JSON in editedOrManuallyAddedBoxes for record ID {record['id']}")
            continue

        img_name = record["maintenanceImagePath"]
        img_url = IMAGE_BASE_URL + record["maintenanceImageUrl"]

        img_save = os.path.join(f'{DATASET_DIR}/images', img_name)
        lbl_save = os.path.join(f'{DATASET_DIR}/labels', img_name.replace(".jpg", ".txt"))

        if download_image(img_url, img_save):
            convert_to_yolo(boxes, img_save, lbl_save)
            processed += 1
    
    print(f"Processed {processed} images with edited boxes.")
    return processed