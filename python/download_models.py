import boto3
import os
from botocore.exceptions import ClientError

def download_model(bucket_name, s3_key, local_path):
    s3 = boto3.client("s3", region_name="eu-north-1")  # Stockholm region

    if os.path.exists(local_path):
        print(f"✅ {local_path} already exists, skipping download")
        return

    os.makedirs(os.path.dirname(local_path), exist_ok=True)

    try:
        s3.head_object(Bucket=bucket_name, Key=s3_key)
        print(f"⬇️ Downloading {s3_key} -> {local_path}")
        s3.download_file(bucket_name, s3_key, local_path)
        print(f"✅ Downloaded {s3_key}")
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == "404":
            print(f"❌ S3 object not found: {s3_key}")
        elif error_code == "403":
            print(f"❌ Access forbidden to S3 object: {s3_key}")
        else:
            print(f"❌ Failed to download {s3_key}: {e}")

if __name__ == "__main__":
    BUCKET = "h-c-b-m"

    MODELS = {
        "models/nail_model.tflite": "python/models/anemia_nail/nail_model.tflite",
        "models/tongue_disease_model.keras": "python/models/tongue_disease/tongue_disease_model.keras",
        "models/eye_Model.keras": "python/models/eye/eye_Model.keras",
        "models/hair_Model.tflite": "python/models/hair/hair_Model.tflite",
        "models/nail_Model.tflite": "python/models/nail/nail_Model.tflite",
        "models/cosmetic_Model.tflite": "python/models/cosmetic/cosmetic_Model.tflite",
    }

    for s3_key, local_path in MODELS.items():
        download_model(BUCKET, s3_key, local_path)
