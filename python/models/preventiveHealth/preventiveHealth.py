#!/usr/bin/env python3
import sys
import json

def predict_health_risks(patient):
    # --- Patient Data with Defaults ---
    age = int(patient.get("age", 40))
    sex = patient.get("sex", "Male")
    bmi = float(patient.get("bmi", 25))
    systolic_bp = int(patient.get("systolic_bp", 120))
    diastolic_bp = int(patient.get("diastolic_bp", 80))
    heart_rate = int(patient.get("resting_heart_rate_bpm", 75))
    cholesterol = int(patient.get("total_cholesterol_mg_dl", 190))
    glucose = int(patient.get("glucose_mg_dl", 95))
    hba1c = float(patient.get("hba1c_percent", 5.4))
    smoking_status = patient.get("smoking_status", "Never")
    exercise = patient.get("exercise_frequency", "Sedentary")
    stress_level = int(patient.get("stress_level", 5))
    alcohol = patient.get("alcohol_consumption", "None")

    # --- HEALTH SCORE ---
    health_score = 0
    recommendations = []
    risk_factors = []  # This will now be populated
    critical_alerts = []  # This will now be populated

    # Age
    health_score += (age - 18) * 0.5
    if age > 50:
        recommendations.append("Regular health screenings recommended")
        risk_factors.append(f"Age factor: {age} years (increased baseline risk)")

    # BMI
    if bmi > 30:
        health_score += 20
        recommendations.append("Weight loss program needed")
        risk_factors.append(f"Obesity: BMI {bmi:.1f} (>30)")
    elif bmi > 25:
        health_score += 10
        recommendations.append("Weight management program")
        risk_factors.append(f"Overweight: BMI {bmi:.1f} (25-30)")
    elif bmi < 18.5:
        health_score += 5
        recommendations.append("Healthy weight gain recommended")
        risk_factors.append(f"Underweight: BMI {bmi:.1f} (<18.5)")

    # Blood Pressure
    if systolic_bp > 140 or diastolic_bp > 90:
        health_score += 25
        recommendations.append("Control blood pressure (DASH diet, low salt)")
        risk_factors.append(f"Hypertension: {systolic_bp}/{diastolic_bp} mmHg")
        if systolic_bp > 180 or diastolic_bp > 110:
            critical_alerts.append("Severe hypertension - seek immediate medical care")
    elif systolic_bp > 120 or diastolic_bp > 80:
        health_score += 10
        recommendations.append("Monitor blood pressure regularly")
        risk_factors.append(f"Elevated BP: {systolic_bp}/{diastolic_bp} mmHg")

    # Heart Rate
    if heart_rate > 100:
        health_score += 20
        recommendations.append("Cardiology consultation recommended")
        risk_factors.append(f"Tachycardia: {heart_rate} BPM (>100)")
        critical_alerts.append("Heart rate over 100 BPM - medical evaluation needed")
    elif heart_rate > 90:
        health_score += 15
        recommendations.append("Improve cardiovascular fitness")
        risk_factors.append(f"Elevated heart rate: {heart_rate} BPM (>90)")
    elif heart_rate < 50:
        health_score += 10
        recommendations.append("Monitor heart rate - possible bradycardia")
        risk_factors.append(f"Low heart rate: {heart_rate} BPM (<50)")

    # Cholesterol
    if cholesterol > 240:
        health_score += 20
        recommendations.append("Reduce cholesterol via low-fat diet")
        risk_factors.append(f"High cholesterol: {cholesterol} mg/dL (>240)")
    elif cholesterol > 200:
        health_score += 10
        recommendations.append("Monitor cholesterol levels")
        risk_factors.append(f"Borderline high cholesterol: {cholesterol} mg/dL (200-240)")

    # Glucose / HbA1c - CRITICAL CHECKS
    if glucose > 400:
        health_score += 50
        recommendations.append("🚨 EMERGENCY: Seek immediate medical care")
        risk_factors.append(f"Dangerously high glucose: {glucose} mg/dL")
        critical_alerts.append(f"EMERGENCY: Blood glucose {glucose} mg/dL - life threatening!")
    elif glucose > 126 or hba1c > 6.5:
        health_score += 30
        recommendations.append("Monitor & manage blood sugar levels")
        risk_factors.append(f"Diabetes: Glucose {glucose} mg/dL, HbA1c {hba1c}%")
        if glucose > 300:
            critical_alerts.append("Very high blood glucose - urgent medical care needed")
    elif glucose > 100 or hba1c > 5.7:
        health_score += 15
        recommendations.append("Prediabetes monitoring recommended")
        risk_factors.append(f"Prediabetes: Glucose {glucose} mg/dL, HbA1c {hba1c}%")

    # Smoking
    if smoking_status == "Current":
        health_score += 30
        recommendations.append("🚭 Urgent: Quit smoking")
        risk_factors.append("Current smoker (major risk factor)")
    elif smoking_status == "Former":
        health_score += 5
        recommendations.append("Continue smoke-free lifestyle")
        risk_factors.append("Former smoker (residual risk)")

    # Exercise
    if exercise in ["Sedentary", "1-2 times/week"]:
        health_score += 15
        recommendations.append("Increase physical activity (150 min/week)")
        risk_factors.append(f"Low physical activity: {exercise}")

    # Stress
    if stress_level > 7:
        health_score += 10
        recommendations.append("Stress management is required")
        risk_factors.append(f"High stress level: {stress_level}/10")
    elif stress_level > 5:
        risk_factors.append(f"Moderate stress: {stress_level}/10")

    # Alcohol
    if alcohol in ["8-14 per week", "15+ per week"]:
        health_score += 15
        recommendations.append("Reduce alcohol intake significantly")
        risk_factors.append(f"Heavy alcohol use: {alcohol}")
        if alcohol == "15+ per week":
            critical_alerts.append("Excessive alcohol consumption - health risks")
    elif alcohol in ["3-7 per week"]:
        health_score += 5
        recommendations.append("Moderate alcohol consumption advised")
        risk_factors.append(f"Moderate alcohol use: {alcohol}")

    health_score = min(100, max(0, health_score))

    # --- CVD Risk ---
    cvd_risk = 0
    cvd_risk += age * (0.8 if sex == "Male" else 0.6)
    if systolic_bp > 140: cvd_risk += 25
    if heart_rate > 85: cvd_risk += 15
    if cholesterol > 240: cvd_risk += 20
    if smoking_status == "Current": cvd_risk += 25
    if bmi > 30: cvd_risk += 10
    cvd_risk = min(100, max(0, cvd_risk)) / 100

    # --- Diabetes Risk ---
    diabetes_risk = 0
    if age > 45: diabetes_risk += 15
    if bmi > 30: diabetes_risk += 30
    elif bmi > 25: diabetes_risk += 15
    if glucose > 100: diabetes_risk += 20
    if hba1c > 5.7: diabetes_risk += 25
    if exercise == "Sedentary": diabetes_risk += 10
    diabetes_risk = min(100, max(0, diabetes_risk)) / 100

    # Risk categorization
    def get_risk_category(score, is_percentage=False):
        if is_percentage:
            if score < 0.2: return "Low"
            elif score < 0.5: return "Moderate"
            else: return "High"
        else:
            if score < 30: return "Low"
            elif score < 60: return "Moderate"
            else: return "High"

    # Add general risk factors for healthy patients too
    if not risk_factors:
        if age > 40:
            risk_factors.append(f"Age: {age} years (normal aging risk)")
        if sex == "Male" and age > 35:
            risk_factors.append("Male gender (higher CVD baseline risk)")
        elif sex == "Female" and age > 55:
            risk_factors.append("Post-menopausal age (if applicable)")
        
        # Always show current values for transparency
        risk_factors.append(f"Current BMI: {bmi:.1f} (healthy range)")
        risk_factors.append(f"Blood pressure: {systolic_bp}/{diastolic_bp} (normal)")
        risk_factors.append(f"Heart rate: {heart_rate} BPM (normal)")

    return {
        "health_score": round(health_score, 1),
        "health_category": get_risk_category(health_score),
        "cvd_risk": round(cvd_risk * 100, 1),
        "cvd_category": get_risk_category(cvd_risk, True),
        "diabetes_risk": round(diabetes_risk * 100, 1),
        "diabetes_category": get_risk_category(diabetes_risk, True),
        "recommendations": recommendations or ["Maintain current healthy lifestyle"],
        "risk_factors": risk_factors,
        "critical_alerts": critical_alerts
    }

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        patient = json.loads(input_data)
        result = predict_health_risks(patient)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))