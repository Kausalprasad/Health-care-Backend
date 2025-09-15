import os
import torch
import numpy as np
from torchvision import transforms
from PIL import Image, ImageEnhance

class FinalCameraDetector:
    def __init__(self):
        print("Initializing Final Camera Detector...")
        self.class_names = ['Benign', 'Indeterminate', 'Malignant']

        # Dynamic model path
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(self.base_dir, "skin_melanoma_model_mobile.pt")  # TorchScript model

        # Load model & setup transforms
        self.load_model()
        self.setup_transforms()
        self.setup_enhanced_transforms()
        print("Detector ready!")

    def load_model(self):
        try:
            print(f"Loading TorchScript model from: {self.model_path}")
            self.model = torch.jit.load(self.model_path, map_location="cpu")
            self.model.eval()
            print("Model loaded successfully")
        except Exception as e:
            print(f"Model load error: {e}")
            raise

    def setup_transforms(self):
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])

    def setup_enhanced_transforms(self):
        # Optional enhancement: contrast, color, sharpness
        def enhance_image(pil_image):
            pil_image = ImageEnhance.Contrast(pil_image).enhance(1.3)
            pil_image = ImageEnhance.Color(pil_image).enhance(1.2)
            pil_image = ImageEnhance.Sharpness(pil_image).enhance(1.1)
            return pil_image

        self.transform_enhanced = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Lambda(enhance_image),
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])

    def predict(self, image, enhanced=False):
        """
        image: np.array (RGB or BGR)
        enhanced: bool, whether to use enhancement
        Returns: pred_class (int), confidence (float), probabilities (np.array)
        """
        try:
            # Convert BGR to RGB if needed
            if image.shape[2] == 3:
                img = image[..., ::-1] if np.max(image) > 1 else image
            else:
                img = image

            transform = self.transform_enhanced if enhanced else self.transform
            input_tensor = transform(img).unsqueeze(0)  # Add batch dim

            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, pred_class = torch.max(probabilities, 1)
                return pred_class.item(), confidence.item(), probabilities[0].numpy()
        except Exception as e:
            print(f"Prediction error: {e}")
            # Default fallback
            return 0, 0.5, np.array([0.5, 0.3, 0.2])
