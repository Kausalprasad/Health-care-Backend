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

def diseases_from_raw_scores(raw_scores: Dict[str, float], threshold: float = 0.5, explain_rules: bool = False):
    feature_bools = scores_to_feature_bools(raw_scores, threshold=threshold)
    return map_features_to_diseases(feature_bools, explain_rules=explain_rules)
