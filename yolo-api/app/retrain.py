from ultralytics import YOLO
import os, datetime
import requests
import json
import torch

DATA_YAML = 'dataset/data.yaml'
CURRENT_MODEL = 'models/best.pt'
TRAIN_DIR = 'models/retrain_logs'

# Backend API configuration
BACKEND_BASE_URL = 'http://localhost:8080'  # Adjust if backend runs on different port
CLEANUP_API_ENDPOINT = '/api/inspections/cleanup/all-annotations'

if torch.cuda.is_available():
    retrain_device = 'cuda'
    DEVICE = torch.device('cuda')
else:
    retrain_device = 'cpu'
    DEVICE = torch.device('cpu')

def cleanup_bounding_box_annotations():
    try:
        cleanup_url = f"{BACKEND_BASE_URL}{CLEANUP_API_ENDPOINT}"
        
        print(f"Calling cleanup API: {cleanup_url}")
        
        # Make POST request to cleanup endpoint
        response = requests.post(
            cleanup_url,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            cleanup_data = response.json()
            print("Successfully cleaned up bounding box annotations!")
            print(f"Inspections updated: {cleanup_data.get('inspectionsUpdated', 'N/A')}")
            
            stats_before = cleanup_data.get('statisticsBeforeCleanup', {})
            if stats_before:
                print(f"Total inspections: {stats_before.get('totalInspections', 'N/A')}")
                print(f"Had annotation changes: {stats_before.get('inspectionsWithBoundingBoxChanges', 'N/A')}")
                
            cleanup_time = cleanup_data.get('cleanupTimestamp', 'N/A')
            print(f"Cleanup completed at: {cleanup_time}")
            
            return True
            
        else:
            print(f"Cleanup API call failed with status code: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data.get('message', 'No error message provided')}")
            except:
                print(f"Response text: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("Failed to connect to backend API. Make sure the backend server is running.")
        print(f"Attempted to connect to: {BACKEND_BASE_URL}")
        return False
        
    except requests.exceptions.Timeout:
        print("Cleanup API call timed out after 30 seconds.")
        return False
        
    except Exception as e:
        print(f"Unexpected error during cleanup API call: {str(e)}")
        return False

def retrain_model():
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    run_name = f'retrain_{timestamp}'

    print(f"Starting model retraining at {timestamp}")
    print(f"   - Run name: {run_name}")
    print(f"   - Data config: {DATA_YAML}")
    print(f"   - Current model: {CURRENT_MODEL}")

    model = YOLO(CURRENT_MODEL)
    
    if retrain_device == 'cuda':
        batch_size = 16
    elif retrain_device == 'cpu':
        batch_size = 4
    
    model.train(
        data=DATA_YAML,
        epochs=10,
        batch=batch_size,
        imgsz=640,
        device=DEVICE,
        name=run_name,
        project=TRAIN_DIR,
        verbose=True,
        patience=10,  # Early stopping patience
        save_period=5,  # Save checkpoint every 5 epochs
    )

    new_weights = os.path.join(TRAIN_DIR, run_name, "weights", "best.pt")
    
    if os.path.exists(new_weights):
        # Replace old model with new one
        os.replace(new_weights, CURRENT_MODEL)
        print(f"Model retrained successfully using {retrain_device}!")
        print(f"New weights saved to: {CURRENT_MODEL}")
        
        # Call cleanup API to remove old bounding box annotations
        print("\n Cleaning up old bounding box annotations...")
        cleanup_success = cleanup_bounding_box_annotations()
        
        if cleanup_success:
            print("Retraining and cleanup completed successfully!")
            print("The new model is ready to use with clean annotation data.")
        else:
            print("Model retraining completed, but cleanup failed.")
            print("You may want to manually call the cleanup API:")
            print(f"POST {BACKEND_BASE_URL}{CLEANUP_API_ENDPOINT}")

        return True
    
    else:
        print("Retraining failed. New weights not found.")
        print("Cleanup will not be performed since retraining was unsuccessful.")
        return False

# if __name__ == "__main__":
#     """
#     Run retraining when script is executed directly.
#     """
#     print("=" * 60)
#     print("🤖 YOLO Model Retraining with Automatic Cleanup")
#     print("=" * 60)
    
#     success = retrain_model()
    
#     print("\n" + "=" * 60)
#     if success:
#         print("✅ PROCESS COMPLETED SUCCESSFULLY")
#         print("   - Model has been retrained with latest data")
#         print("   - Old bounding box annotations have been cleaned")
#         print("   - System is ready for fresh annotations")
#     else:
#         print("❌ PROCESS FAILED")
#         print("   - Check logs above for error details")
#         print("   - Manual intervention may be required")
#     print("=" * 60)