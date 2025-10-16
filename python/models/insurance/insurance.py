import json, sys
from datetime import datetime
import random

# ------------------- CLAIM PREDICTION FUNCTION -------------------
def predict_insurance_claim(operation_name, operation_cost, insurance_company,
                           policy_type, patient_age, pre_existing_conditions=0,
                           emergency_case=0):
    try:
        base_approval = random.uniform(0.65, 0.9)
        condition_penalty = 1 - (pre_existing_conditions * 0.05)
        emergency_penalty = 0.95 if emergency_case else 1
        age_penalty = 0.95 if patient_age > 60 else 1

        claim_approved = operation_cost * base_approval * condition_penalty * emergency_penalty * age_penalty
        claim_approved = min(claim_approved, operation_cost)
        patient_payment = operation_cost - claim_approved
        approval_percentage = round((claim_approved / operation_cost) * 100, 2)

        return {
            "status": "success",
            "type": "prediction",
            "timestamp": datetime.now().isoformat(),
            "operation_name": operation_name,
            "operation_cost": round(operation_cost, 2),
            "insurance_company": insurance_company,
            "policy_type": policy_type,
            "patient_age": patient_age,
            "pre_existing_conditions": pre_existing_conditions,
            "emergency_case": emergency_case,
            "claim_approved": round(claim_approved, 2),
            "patient_payment": round(patient_payment, 2),
            "approval_percentage": approval_percentage
        }
    except Exception as e:
        return {"status": "error", "error_message": str(e)}


# ------------------- BILL GENERATION FUNCTION -------------------
def generate_patient_bill(patient_name, operation_name, operation_cost,
                          insurance_company, policy_type, claim_approved):
    try:
        total_bill = round(operation_cost * 1.15 + 7000, 2)
        patient_must_pay = round(total_bill - claim_approved, 2)

        return {
            "status": "success",
            "type": "bill",
            "bill_number": f"BILL{random.randint(10000, 99999)}",
            "bill_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "patient_info": {
                "name": patient_name,
                "hospital": random.choice(["Apollo", "Fortis", "AIIMS", "Max", "Manipal"]),
                "operation": operation_name
            },
            "cost_breakdown": {
                "operation_cost": operation_cost,
                "hospital_charges": round(operation_cost * 0.1, 2),
                "medicine_cost": round(operation_cost * 0.05, 2),
                "consultation_fee": 2000,
                "room_charges": 5000,
                "total_bill": total_bill
            },
            "insurance_claim": {
                "claim_approved": claim_approved,
                "claim_rejected": round(operation_cost - claim_approved, 2),
                "approval_percentage": round((claim_approved / operation_cost) * 100, 2)
            },
            "payment_summary": {
                "total_bill_amount": total_bill,
                "insurance_covers": claim_approved,
                "patient_must_pay": patient_must_pay
            }
        }
    except Exception as e:
        return {"status": "error", "error_message": str(e)}


# ------------------- MAIN ENTRY -------------------
if __name__ == "__main__":
    try:
        mode = sys.argv[1]  # "predict" or "bill"
        data = json.loads(sys.argv[2])

        if mode == "predict":
            result = predict_insurance_claim(
                operation_name=data.get("operation_name"),
                operation_cost=float(data.get("operation_cost")),
                insurance_company=data.get("insurance_company"),
                policy_type=data.get("policy_type"),
                patient_age=int(data.get("patient_age")),
                pre_existing_conditions=int(data.get("pre_existing_conditions", 0)),
                emergency_case=int(data.get("emergency_case", 0))
            )
        elif mode == "bill":
            result = generate_patient_bill(
                patient_name=data.get("patient_name", "Unknown"),
                operation_name=data.get("operation_name"),
                operation_cost=float(data.get("operation_cost")),
                insurance_company=data.get("insurance_company"),
                policy_type=data.get("policy_type"),
                claim_approved=float(data.get("claim_approved", 0))
            )
        else:
            result = {"status": "error", "error_message": "Invalid mode argument"}

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "error_message": str(e)}))
