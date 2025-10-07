# -*- coding: utf-8 -*-
"""Enhanced Diet Plan Generator with Medical Conditions & Allergies Support"""
import os
import sys
import json
import requests
from datetime import datetime
from dataclasses import dataclass
from typing import List, Optional, Dict
from dotenv import load_dotenv

# === Load environment variables ===
load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY_DITE")

# ===== CONFIG =====

MODEL = "llama-3.3-70b-versatile"
ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

# ===== MEDICAL & ALLERGY DATABASES =====
MEDICAL_DIET_MODIFICATIONS = {
    "diabetes": "low glycemic index, controlled carbohydrates, high fiber",
    "hypertension": "low sodium, DASH diet principles, potassium-rich foods",
    "heart_disease": "low saturated fat, omega-3 rich, Mediterranean style",
    "kidney_disease": "controlled protein, low phosphorus, low potassium",
    "liver_disease": "low fat, controlled protein, no alcohol",
    "thyroid_disorders": "iodine awareness, metabolism support",
    "pcos": "low glycemic index, anti-inflammatory foods",
    "arthritis": "anti-inflammatory foods, omega-3 rich",
    "gastritis": "bland diet, avoid spicy and acidic foods",
    "ibs": "low FODMAP considerations, fiber management",
    "anemia": "iron-rich foods, vitamin C for absorption",
    "osteoporosis": "calcium-rich, vitamin D, magnesium"
}

ALLERGY_SUBSTITUTIONS = {
    "dairy": "plant milk, coconut milk, almond milk, cashew cream",
    "gluten": "rice, quinoa, buckwheat, millet, amaranth",
    "nuts": "seeds (sunflower, pumpkin), tahini, coconut",
    "eggs": "flax eggs, chia seeds, aquafaba, banana",
    "soy": "coconut aminos, nutritional yeast alternatives",
    "shellfish": "fish alternatives, plant proteins",
    "peanuts": "other legumes, sunflower seed butter"
}

ECONOMIC_STRATEGIES = {
    "low_budget": {
        "focus": "bulk grains, lentils, seasonal vegetables, minimal processed foods",
        "cost_per_day": "₹50-100"
    },
    "moderate_budget": {
        "focus": "balanced variety, some protein sources, moderate convenience foods",
        "cost_per_day": "₹100-200"
    },
    "comfortable_budget": {
        "focus": "diverse ingredients, quality proteins, organic options when beneficial",
        "cost_per_day": "₹200-400"
    },
    "premium_budget": {
        "focus": "premium ingredients, superfoods, organic produce, diverse proteins",
        "cost_per_day": "₹400+"
    }
}


def calculate_health_metrics(params: dict) -> dict:
    """Calculate BMI, BMR, and target calories with age consideration"""
    height = params.get("height", 165)
    weight = params.get("weight", 60)
    age = params.get("age", 30)
    sex = params.get("sex", "male")
    activity_level = params.get("activity_level", "moderate")
    goal = params.get("goal", "maintain weight")

    # Calculate BMI
    height_m = height / 100
    bmi = round(weight / (height_m ** 2), 1)

    # BMI Category
    if bmi < 18.5:
        health_category = "Underweight"
    elif 18.5 <= bmi < 25:
        health_category = "Normal Weight"
    elif 25 <= bmi < 30:
        health_category = "Overweight"
    else:
        health_category = "Obese"

    # Calculate BMR (Mifflin-St Jeor Equation)
    if sex.lower() == 'male':
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161

    # Activity multipliers
    multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very active': 1.9
    }

    daily_calories = int(bmr * multipliers.get(activity_level.lower(), 1.375))

    # Goal adjustments
    goal_lower = goal.lower()
    if 'loss' in goal_lower:
        target_calories = daily_calories - 500
    elif any(kw in goal_lower for kw in ['gain', 'building', 'muscle']):
        if 'muscle' in goal_lower or 'building' in goal_lower:
            target_calories = daily_calories + 600  # Extra for muscle building
        else:
            target_calories = daily_calories + 500
    else:
        target_calories = daily_calories

    # Age adjustments
    if age > 60:
        target_calories = int(target_calories * 0.95)
    elif age < 25:
        target_calories = int(target_calories * 1.05)

    return {
        "bmi": bmi,
        "bmr": round(bmr, 2),
        "target_calories": target_calories,
        "health_category": health_category
    }


def generate_medical_guidelines(params: dict) -> str:
    """Generate medical dietary guidelines"""
    medical_conditions = params.get("medical_conditions", [])
    age = params.get("age", 30)
    
    if not medical_conditions:
        guidelines = "No specific medical dietary restrictions identified."
    else:
        guidelines = "⚕️ Medical Condition Dietary Considerations:\n"
        for condition in medical_conditions:
            condition_lower = condition.lower()
            matched = False
            for key, modification in MEDICAL_DIET_MODIFICATIONS.items():
                if key in condition_lower:
                    guidelines += f"• {condition}: {modification}\n"
                    matched = True
                    break
            if not matched:
                guidelines += f"• {condition}: Consult healthcare provider for specific guidelines\n"

    # Age-specific considerations
    if age > 65:
        guidelines += "\n🧓 Senior Nutrition: Increase protein (1.2-1.6g/kg), focus on calcium, vitamin D, B12\n"
    elif age < 25:
        guidelines += "\n🧑 Young Adult Nutrition: Support growth, ensure adequate calcium for bone mass\n"

    return guidelines


def generate_allergy_modifications(params: dict) -> str:
    """Generate allergy-safe alternatives"""
    allergies = params.get("allergies", [])
    
    if not allergies:
        return "No food allergies reported."

    modifications = "🚫 Allergy Modifications:\n"
    for allergy in allergies:
        allergy_lower = allergy.lower()
        matched = False
        for key, substitution in ALLERGY_SUBSTITUTIONS.items():
            if key in allergy_lower:
                modifications += f"• {allergy}: Use {substitution}\n"
                matched = True
                break
        if not matched:
            modifications += f"• {allergy}: Strictly avoid, consult labels carefully\n"

    modifications += "⚠️ Always read ingredient labels and inform restaurants about allergies\n"
    return modifications


def generate_economic_strategy(params: dict) -> str:
    """Generate budget-based meal strategy"""
    budget_category = params.get("budget_category", "moderate_budget")
    cooking_time = params.get("cooking_time_available", "Moderate")
    
    strategy_info = ECONOMIC_STRATEGIES.get(budget_category, ECONOMIC_STRATEGIES["moderate_budget"])

    strategy = f"💰 Budget Category: {budget_category.replace('_', ' ').title()}\n"
    strategy += f"• Daily Cost Range: {strategy_info['cost_per_day']}\n"
    strategy += f"• Food Focus: {strategy_info['focus']}\n"
    strategy += f"• Time Available: {cooking_time}\n"

    if budget_category == "low_budget":
        strategy += "\n💡 Money-Saving Tips: Buy in bulk, use seasonal produce, meal prep\n"

    return strategy


def create_enhanced_prompt(params: dict, metrics: dict, medical_guidelines: str,
                          allergy_modifications: str, economic_strategy: str) -> str:
    """Create comprehensive AI prompt"""
    
    region = params.get("region", "North India")
    goal = params.get("goal", "maintain weight")
    food_pref = params.get("food_preference", "vegetarian")
    activity = params.get("activity_level", "moderate")
    medications = params.get("medications", [])

    prompt = f"""Create a comprehensive 7-day {region} diet plan with the following specifications:

PATIENT PROFILE:
- Age: {params.get('age', 30)} years, {params.get('sex', 'male')}, {params.get('weight', 60)}kg, {params.get('height', 165)}cm
- BMI: {metrics['bmi']} ({metrics['health_category']})
- Goal: {goal}
- Activity Level: {activity}
- Target Calories: {metrics['target_calories']}/day
- Food Preference: {food_pref}
- Budget Category: {params.get('budget_category', 'moderate_budget').replace('_', ' ').title()}
- Cooking Time: {params.get('cooking_time_available', 'Moderate')}

MEDICAL CONSIDERATIONS:
{medical_guidelines}

ALLERGY INFORMATION:
{allergy_modifications}

ECONOMIC PLANNING:
{economic_strategy}

MEDICATIONS (consider interactions):
{', '.join(medications) if medications else 'None reported'}

Please create a diet plan that:
1. Addresses all medical conditions with appropriate food choices
2. Completely avoids all allergens and provides safe alternatives
3. Fits within the specified budget category
4. Uses traditional {region} cuisine
5. Includes age-appropriate nutrition

Format each day as:
### Day X - [Theme]

**Breakfast**: [meal with quantities]
([calories] cal, Carbs: [X]g, Protein: [X]g, Fat: [X]g)
*Medical Note*: [benefits for conditions]
*Cost Estimate*: [₹amount]

**Lunch**: [meal with quantities]
([calories] cal, Carbs: [X]g, Protein: [X]g, Fat: [X]g)
*Medical Note*: [benefits]
*Cost Estimate*: [₹amount]

**Dinner**: [meal with quantities]
([calories] cal, Carbs: [X]g, Protein: [X]g, Fat: [X]g)
*Medical Note*: [benefits]
*Cost Estimate*: [₹amount]

**Snacks**: [items] ([calories] cal, Carbs: [X]g, Protein: [X]g, Fat: [X]g)
*Cost Estimate*: [₹amount]

**Daily Total**: [X] calories | **Macros**: Carbs: [X]g, Protein: [X]g, Fat: [X]g, Fiber: [X]g
**Daily Cost**: ₹[total]
**Medical Benefits**: [summary]
"""
    return prompt


def call_groq_api(prompt: str, region: str) -> Dict:
    """Call Groq API with enhanced system prompt"""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "messages": [
            {
                "role": "system",
                "content": f"""You are a senior clinical nutritionist and dietitian specializing in {region} cuisine with expertise in:
- Medical nutrition therapy for chronic conditions
- Food allergy management and substitutions
- Budget-conscious meal planning
- Age-specific nutritional requirements
- Cultural food preferences and traditional cooking methods

Create practical, safe, and culturally appropriate diet plans that address all health considerations."""
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "model": MODEL,
        "temperature": 0.7,
        "max_tokens": 4000
    }

    try:
        response = requests.post(ENDPOINT, headers=headers, json=data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            diet_plan = result['choices'][0]['message']['content']
            return {"success": True, "diet_plan": diet_plan}
        else:
            return {"success": False, "error": f"API request failed: {response.status_code}"}

    except Exception as e:
        return {"success": False, "error": f"API call failed: {str(e)}"}


def generate_comprehensive_diet_plan(params: dict) -> dict:
    """Main function to generate enhanced diet plan"""
    
    # Calculate health metrics
    metrics = calculate_health_metrics(params)
    
    # Generate supplementary information
    medical_guidelines = generate_medical_guidelines(params)
    allergy_modifications = generate_allergy_modifications(params)
    economic_strategy = generate_economic_strategy(params)
    
    # Create comprehensive prompt
    prompt = create_enhanced_prompt(params, metrics, medical_guidelines,
                                   allergy_modifications, economic_strategy)
    
    # Generate diet plan
    region = params.get("region", "North India")
    diet_result = call_groq_api(prompt, region)
    
    if diet_result["success"]:
        return {
            "success": True,
            "user_profile": {
                "height": f"{params.get('height', 165)} cm",
                "weight": f"{params.get('weight', 60)} kg",
                "age": f"{params.get('age', 30)} years",
                "sex": params.get("sex", "male"),
                "bmi": metrics["bmi"],
                "health_category": metrics["health_category"],
                "medical_conditions": params.get("medical_conditions", []),
                "allergies": params.get("allergies", []),
                "target_calories": metrics["target_calories"],
                "budget_category": params.get("budget_category", "moderate_budget")
            },
            "dietary_guidelines": medical_guidelines,
            "allergy_modifications": allergy_modifications,
            "economic_strategy": economic_strategy,
            "diet_plan": diet_result["diet_plan"],
            "bmr": metrics["bmr"],
            "generated_at": datetime.now().isoformat()
        }
    else:
        return {"success": False, "error": diet_result.get("error", "Unknown error")}


if __name__ == "__main__":
    try:
        raw = sys.stdin.read()
        params = json.loads(raw)
        result = generate_comprehensive_diet_plan(params)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))