from typing import Dict, List, Tuple

LABEL_COLUMNS: List[str] = [
    "colorResult_grey",
    "colorResult_white",
    "colorResult_yellow",
    "shapeResult_ToothMarks",
    "shapeResult_fat",
    "shapeResult_normal",
    "shapeResult_thin",
    "textureResult_dark",
    "textureResult_normal",
    "textureResult_tender",
    "textureResult_water",
    "thicknessResult_Stripping",
    "thicknessResult_ecchymosis",
    "thicknessResult_greasy",
    "thicknessResult_thin",
]

def scores_to_feature_bools(raw_scores: Dict[str, float], threshold: float = 0.5) -> Dict[str, bool]:
    return {k: (float(raw_scores.get(k, 0.0)) >= threshold) for k in LABEL_COLUMNS}

def map_features_to_diseases(feature_dict: Dict[str, bool], explain_rules: bool = False) -> List[str] | Tuple[List[str], List[str]]:
    diseases: List[str] = []
    fired_rules: List[str] = []
    def add(rule_ok: bool, disease: str, rule_desc: str):
        if rule_ok:
            diseases.append(disease)
            fired_rules.append(rule_desc)
    add(
        feature_dict.get("colorResult_white") and feature_dict.get("thicknessResult_thin"),
        "Possible anemia or chronic deficiency",
        "colorResult_white AND thicknessResult_thin",
    )
    add(
        feature_dict.get("colorResult_yellow") and feature_dict.get("thicknessResult_greasy"),
        "Gastric damp-heat or infection",
        "colorResult_yellow AND thicknessResult_greasy",
    )
    add(
        feature_dict.get("shapeResult_ToothMarks"),
        "Spleen Qi deficiency",
        "shapeResult_ToothMarks",
    )
    add(
        feature_dict.get("thicknessResult_thin"),
        "Deficiency or dehydration (thin coating)",
        "thicknessResult_thin",
    )
    add(
        feature_dict.get("colorResult_white") and feature_dict.get("thicknessResult_greasy"),
        "Damp accumulation with cold signs",
        "colorResult_white AND thicknessResult_greasy",
    )
    add(
        feature_dict.get("shapeResult_fat") and feature_dict.get("thicknessResult_greasy"),
        "Phlegm-damp retention",
        "shapeResult_fat AND thicknessResult_greasy",
    )
    if diseases:
        diseases = list(dict.fromkeys(diseases))
    else:
        diseases = ["Your Tongue is Healthy! No issues detected."]
    if explain_rules:
        return diseases, fired_rules
    return diseases

# New dictionary to map diseases to remedies and medications
RECOMMENDATIONS: Dict[str, Dict[str, List[str]]] = {
    "Possible anemia or chronic deficiency": {
        "home_remedies": [
            "Eat iron-rich foods (spinach, beetroot, dates, raisins, red meat, eggs, pulses)",
            "Increase vitamin C intake (oranges, lemons, guavas) for iron absorption",
            "Drink beetroot or pomegranate juice regularly",
            "Use blackstrap molasses in your diet",
        ],
        "medications": [
            "Iron supplements (with medical advice)",
            "Vitamin B12 tablets (if diagnosed deficient)",
        ],
    },
    "Gastric damp-heat or infection": {
        "home_remedies": [
            "Drink ginger root water or ginger tea",
            "Sip peppermint tea to soothe digestion",
            "Use homemade saline solutions for hydration",
            "Avoid greasy, fried foods; eat bland meals",
        ],
        "medications": [
            "Prescribed antacids",
            "Antibiotics (only if prescribed)",
        ],
    },
    "Spleen Qi deficiency": {
        "home_remedies": [
            "Eat warm, cooked foods (brown rice, sweet potatoes, oats, legumes, fish)",
            "Consume herbs: ginseng, lotus seed, yam, orange peel, licorice",
            "Eat small, regular meals; avoid cold, raw, sweet foods",
        ],
        "medications": [
            "TCM herbal supplements for Spleen Qi (with professional advice)",
        ],
    },
    "Deficiency or dehydration (thin coating)": {
        "home_remedies": [
            "Drink plenty of fluids: water, coconut water",
            "Use coconut or sesame oil pulling for moisture",
            "Suck sugar-free lozenges or chew gum",
            "Apply aloe vera gel for soreness",
        ],
        "medications": [
            "Oral rehydration solutions (for severe dehydration)",
        ],
    },
    "Damp accumulation with cold signs": {
        "home_remedies": [
            "Eat bland, warm foods; avoid cold, raw, greasy diets",
            "Use warming herbs: ginger, cinnamon, Fu Ling (Poria), Licorice, Cang Zhu",
        ],
        "medications": [
            "TCM formulas for damp-cold syndrome (with professional advice)",
        ],
    },
    "Phlegm-damp retention": {
        "home_remedies": [
            "Gargle with salt water",
            "Drink hot fluids and herbal teas",
            "Use a humidifier or inhale steam",
            "Add turmeric, ginger, mint, cardamom to diet",
        ],
        "medications": [
            "Expectorants like guaifenesin (with advice)",
            "Nasal sprays or decongestants if prescribed",
        ],
    },
    "Your Tongue is Healthy! No issues detected.": {
        "home_remedies": [
            "No action required—continue maintaining good habits!",
        ],
        "medications": [],
    }
}

def get_recommendations(disease: str) -> Dict[str, List[str]]:
    return RECOMMENDATIONS.get(disease, {
        "home_remedies": ["Maintain a balanced diet, stay hydrated, and seek periodic checkups."],
        "medications": []
    })

def diseases_from_raw_scores(raw_scores: Dict[str, float], threshold: float = 0.5, explain_rules: bool = False):
    feature_bools = scores_to_feature_bools(raw_scores, threshold=threshold)
    diseases = map_features_to_diseases(feature_bools, explain_rules=explain_rules)
    if explain_rules:
        disease_names, rule_texts = diseases
    else:
        disease_names = diseases
    # Add recommendation information for each disease
    result_with_recommendations = []
    for disease in disease_names:
        recs = get_recommendations(disease)
        result_with_recommendations.append((disease, recs))
    if explain_rules:
        return result_with_recommendations, rule_texts
    return result_with_recommendations