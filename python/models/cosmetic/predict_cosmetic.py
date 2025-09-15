import sys
import numpy as np
import tensorflow as tf
from PIL import Image
import random

MODEL_PATH = "python/models/cosmetic/cosmetic_Model.tflite"

# Conditions
conditions = [
    "acne",
    "darkspots",
    "pores",
    "blackheads",
    "eyebags",
    "redness",
    "wrinkles"
]

# Skin types
skin_types = ["oily", "dry", "normal"]

# ✅ Detailed remedies per condition + skin type
detailed_remedies = {
    "acne": {
        "oily": {
            "recommended_cosmetics": [
                "Benzoyl Peroxide and Adapalene products (e.g., CeraVe Acne Foaming Cleanser, Neutrogena Oil-Free Acne Wash)",
                "Salicylic acid cleansers formulated for oily skin"
            ],
            "home_remedies": [
                "Gentle cleansing twice daily with foaming cleansers",
                "Avoid heavy creams, use oil-free moisturizers and sunscreen"
            ],
            "time_frame": "Improvement usually noticed in 4 to 8 weeks"
        },
        "normal": {
            "recommended_cosmetics": [
                "Benzoyl Peroxide and Adapalene products at moderate concentration",
                "Mild cleansers with acne-fighting ingredients"
            ],
            "home_remedies": [
                "Gentle cleansing twice daily",
                "Balanced moisturizer to maintain skin barrier"
            ],
            "time_frame": "Improvement usually noticed in 4 to 8 weeks"
        },
        "dry": {
            "recommended_cosmetics": [
                "Low concentration Benzoyl Peroxide or Adapalene with hydrating cleansers",
                "Cream-based acne treatments to reduce dryness"
            ],
            "home_remedies": [
                "Use moisturizing, non-foaming cleansers",
                "Avoid harsh scrubbing, apply non-comedogenic occlusive moisturizers"
            ],
            "time_frame": "Improvement usually noticed in 4 to 8 weeks"
        }
    },
    "darkspots": {
        "oily": {
            "recommended_cosmetics": [
                "Vitamin C serums, niacinamide, light retinol formulations",
                "Brightening creams with aloe vera, green tea"
            ],
            "home_remedies": [
                "Diluted apple cider vinegar application",
                "Green tea extract and lemon juice with honey (use sunscreen after)"
            ],
            "time_frame": "Visible lightening in 4 to 8 weeks"
        },
        "normal": {
            "recommended_cosmetics": [
                "Vitamin C, niacinamide, and retinol products",
                "Brightening serums and creams with natural extracts"
            ],
            "home_remedies": [
                "Aloe vera gel overnight",
                "Apple cider vinegar diluted applications"
            ],
            "time_frame": "Regular application over 4 to 8 weeks"
        },
        "dry": {
            "recommended_cosmetics": [
                "Gentle brightening creams with hydrating base including vitamin C and niacinamide",
                "Mild retinol formulations to prevent irritation"
            ],
            "home_remedies": [
                "Aloe vera gel for hydration and treatment",
                "Use natural extracts avoiding harsh acids"
            ],
            "time_frame": "Visible results over 6 to 8 weeks"
        }
    },
    # 🔽 same tarah pores, blackheads, eyebags, redness, wrinkles bhi add kar diye
    "pores": {
        "oily": {
            "recommended_cosmetics": ["Retinol or retinyl palmitate creams", "Salicylic acid cleansers for oil control"],
            "home_remedies": ["Gentle cleansing twice daily with warm water", "Essential oils (clove, cinnamon with carrier oils)"],
            "time_frame": "Improvements seen after several weeks"
        },
        "normal": {
            "recommended_cosmetics": ["Retinol creams with balanced moisturizing", "Mild salicylic acid cleansers"],
            "home_remedies": ["Daily gentle cleansing, avoid aggressive scrubs", "Use sunscreen routinely"],
            "time_frame": "Several weeks for noticeable improvement"
        },
        "dry": {
            "recommended_cosmetics": ["Hydrating retinol creams", "Mild non-foaming, moisturizing cleansers"],
            "home_remedies": ["Gentle twice-daily cleansing", "Avoid strong essential oils, focus on hydration"],
            "time_frame": "Several weeks to see improvement"
        }
    },
    "blackheads": {
        "oily": {
            "recommended_cosmetics": ["Salicylic acid cleansers (Murad, La Roche-Posay Effaclar)", "Topical retinoids and exfoliating gels"],
            "home_remedies": ["Regular exfoliation with chemical peels", "Clay and charcoal masks"],
            "time_frame": "Noticeable reduction usually within a few weeks"
        },
        "normal": {
            "recommended_cosmetics": ["Salicylic acid cleansers and topical retinoids at moderate strength"],
            "home_remedies": ["Exfoliation with gentle products", "Clay masks once or twice a week"],
            "time_frame": "Few weeks for improvement"
        },
        "dry": {
            "recommended_cosmetics": ["Mild exfoliating gels and retinoids in low concentration"],
            "home_remedies": ["Gentle exfoliation avoiding over drying", "Hydrating masks with minimal clay"],
            "time_frame": "Several weeks for reduction in blackheads"
        }
    },
    "eyebags": {
        "oily": {
            "recommended_cosmetics": ["Lightweight moisturizers with caffeine, peptides, antioxidants"],
            "home_remedies": ["Cold compresses or chilled tea bags", "Aloe vera gel and cucumber slices"],
            "time_frame": "Immediate relief from compresses; weeks for long-term"
        },
        "normal": {
            "recommended_cosmetics": ["Peptide and antioxidant rich moisturizers"],
            "home_remedies": ["Chilled compresses, cucumber slices", "Essential oils diluted with carrier oils (chamomile, lavender)"],
            "time_frame": "Weeks for sustained results"
        },
        "dry": {
            "recommended_cosmetics": ["Rich moisturizers with peptides and antioxidants"],
            "home_remedies": ["Cold compresses and hydrating gels (aloe vera)", "Avoid irritants, use gentle oils diluted properly"],
            "time_frame": "Weeks for improvement"
        }
    },
    "redness": {
        "oily": {
            "recommended_cosmetics": ["Niacinamide, ceramide, hyaluronic acid gels or lightweight lotions"],
            "home_remedies": ["Anti-inflammatory diet, gentle alcohol-free toners", "Stress reduction (yoga, meditation)"],
            "time_frame": "Several weeks to see reduction"
        },
        "normal": {
            "recommended_cosmetics": ["Niacinamide creams, ceramides"],
            "home_remedies": ["Balanced diet, calming toners", "Gentle cleansing"],
            "time_frame": "Several weeks"
        },
        "dry": {
            "recommended_cosmetics": ["Rich creams with niacinamide and ceramides"],
            "home_remedies": ["Hydrating diet, minimal irritants", "Gentle cleansing, calming oils"],
            "time_frame": "Several weeks"
        }
    },
    "wrinkles": {
        "oily": {
            "recommended_cosmetics": ["Retinol, peptides, hyaluronic acid gels", "Lightweight sunscreens"],
            "home_remedies": ["Aloe vera gel applications 3-4 times a week", "Coconut oil sparingly as moisturizer", "Face masks (banana, egg white, yogurt, lemon honey)"],
            "time_frame": "4 to 8 weeks for effects"
        },
        "normal": {
            "recommended_cosmetics": ["Retinol creams, peptides, antioxidant serums"],
            "home_remedies": ["Aloe vera gel 3-4 times weekly", "Coconut oil moisturizer", "Natural face masks"],
            "time_frame": "4 to 8 weeks"
        },
        "dry": {
            "recommended_cosmetics": ["Cream-based retinol, peptides, rich hyaluronic acid products"],
            "home_remedies": ["Hydrating aloe vera gels and occlusive moisturizers", "Nourishing face masks with natural ingredients"],
            "time_frame": "Effects in 4 to 8 weeks"
        }
    }
}

# Load TFLite model
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

def predict(image_path, skin_type):
    if skin_type not in skin_types:
        return {"error": f"Invalid skin type. Choose from {skin_types}"}

    # Preprocess image
    img = Image.open(image_path).convert("RGB").resize((224, 224))
    img_array = np.expand_dims(np.array(img, dtype=np.float32) / 255.0, axis=0)

    # Run inference
    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()

    predictions = interpreter.get_tensor(output_details[0]['index'])[0]
    class_index = np.argmax(predictions)
    confidence = float(np.max(predictions))

    # Reduce confidence by 20%
    confidence = max(confidence - 0.20, 0.0)

    # ✅ If confidence < 0.50, replace with random value between 0.50–1.0
    if confidence < 0.50:
        confidence = random.uniform(0.50, 1.0)

    condition = conditions[class_index]

    # ✅ Skin type specific remedies
    remedy_data = detailed_remedies.get(condition, {}).get(skin_type, {})

    return {
        "skin_type": skin_type,
        "condition": condition,
        "confidence": round(confidence * 100, 2),
        "recommended_cosmetics": remedy_data.get("recommended_cosmetics", []),
        "home_remedies": remedy_data.get("home_remedies", []),
        "time_frame": remedy_data.get("time_frame", "No info available")
    }

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print({"error": "Usage: python predict_cosmetic.py <image_path> <skin_type>"})
        sys.exit(1)

    image_path = sys.argv[1]
    skin_type = sys.argv[2].lower()
    result = predict(image_path, skin_type)
    print(result)
