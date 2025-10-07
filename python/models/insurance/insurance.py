import sys, json
import pandas as pd
import numpy as np
import random
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score


# ---------------------------
# Insurance Plans Data
# ---------------------------
insurance_plans_data = [
    {
        "provider_name": "UnitedHealthcare",
        "plan_id": "UHC-HMO-1001",
        "plan_type": "HMO",
        "coverage": {
            "conditions_covered": ["diabetes", "hypertension", "asthma"],
            "general_consultation": True,
            "specialist_consultation": True,
            "laboratory_tests": ["blood_test", "cholesterol_test", "blood_sugar"],
            "imaging": ["xray", "ultrasound"],
            "hospitalization": True,
            "medications": ["generic_drugs", "brand_drugs"],
            "pre_existing_conditions": False
        },
        "claim_rules": {
            "max_coverage_amount": 50000,
            "co_pay_percent": 20,
            "deductible_amount": 1500
        }
    },
    {
        "provider_name": "UnitedHealthcare",
        "plan_id": "UHC-PPO-1002",
        "plan_type": "PPO",
        "coverage": {
            "conditions_covered": ["cancer", "arthritis", "depression", "obesity"],
            "general_consultation": True,
            "specialist_consultation": True,
            "laboratory_tests": ["blood_test", "genetic_test", "vitamin_deficiency_test"],
            "imaging": ["mri", "ct_scan"],
            "hospitalization": True,
            "medications": ["generic_drugs", "brand_drugs", "specialty_drugs"],
            "pre_existing_conditions": True
        },
        "claim_rules": {
            "max_coverage_amount": 120000,
            "co_pay_percent": 15,
            "deductible_amount": 1000
        }
    }
]

# ---------------------------
# Process Data
# ---------------------------
def process_insurance_data(insurance_data):
    processed_plans = []
    for plan in insurance_data:
        processed_plans.append({
            "provider_name": plan["provider_name"],
            "plan_id": plan["plan_id"],
            "plan_type": plan["plan_type"],
            "general_consultation": plan["coverage"]["general_consultation"],
            "specialist_consultation": plan["coverage"]["specialist_consultation"],
            "hospitalization": plan["coverage"]["hospitalization"],
            "pre_existing_conditions": plan["coverage"]["pre_existing_conditions"],
            "max_coverage_amount": plan["claim_rules"]["max_coverage_amount"],
            "co_pay_percent": plan["claim_rules"]["co_pay_percent"],
            "deductible_amount": plan["claim_rules"]["deductible_amount"],
            "conditions_covered": plan["coverage"]["conditions_covered"],
            "laboratory_tests": plan["coverage"]["laboratory_tests"],
            "imaging_types": plan["coverage"]["imaging"],
            "medications": plan["coverage"]["medications"]
        })
    return pd.DataFrame(processed_plans)

plans_df = process_insurance_data(insurance_plans_data)

# ---------------------------
# Rule-based functions
# ---------------------------
def check_procedure_coverage(patient, plan_data, procedure):
    if patient.get("current_insurance_plan") is None:
        return False, "No current insurance plan"
    current_plan = plan_data[plan_data["plan_id"] == patient["current_insurance_plan"]]
    if current_plan.empty:
        return False, "Current plan not found"
    plan = current_plan.iloc[0]
    covered_procedures = plan["laboratory_tests"] + plan["imaging_types"]
    return (procedure in covered_procedures,
            f"{'Covered' if procedure in covered_procedures else 'Not covered'} under {plan['plan_type']}")

def recommend_insurance_plans(patient, plan_data, procedure, top_n=3):
    recs = []
    for _, plan in plan_data.iterrows():
        score, reasons = 0, []
        covered_procedures = plan["laboratory_tests"] + plan["imaging_types"]
        if procedure in covered_procedures:
            score += 40
            reasons.append(f"Covers {procedure}")
        if patient["has_pre_existing"] and plan["pre_existing_conditions"]:
            score += 25
            reasons.append("Accepts pre-existing conditions")
        if patient["needs_specialist"] and plan["specialist_consultation"]:
            score += 15
            reasons.append("Specialist consultation available")
        if plan["co_pay_percent"] <= patient["budget_max_copay"]:
            score += 10
            reasons.append("Copay affordable")
        if plan["deductible_amount"] <= patient["budget_max_deductible"]:
            score += 10
            reasons.append("Deductible affordable")
        recs.append({
            "plan_id": plan["plan_id"],
            "provider_name": plan["provider_name"],
            "plan_type": plan["plan_type"],
            "score": score,
            "max_coverage": plan["max_coverage_amount"],
            "copay_percent": plan["co_pay_percent"],
            "deductible": plan["deductible_amount"],
            "reasons": reasons
        })
    return sorted(recs, key=lambda x: x["score"], reverse=True)[:top_n]

# ---------------------------
# CLI entrypoint
# ---------------------------
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Invalid arguments"}))
        sys.exit(1)

    command = sys.argv[1]
    patient = json.loads(sys.argv[2])
    procedure = patient.get("required_procedure")

    if command == "check":
        covered, msg = check_procedure_coverage(patient, plans_df, procedure)
        print(json.dumps({"covered": covered, "message": msg}))

    elif command == "recommend":
        recs = recommend_insurance_plans(patient, plans_df, procedure, top_n=3)
        print(json.dumps(recs, indent=2))

    else:
        print(json.dumps({"error": "Unknown command"}))
