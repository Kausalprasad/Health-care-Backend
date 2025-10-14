# -*- coding: utf-8 -*-
"""
Baby Development Recommendation System
Python module to generate personalized baby recommendations using Groq AI
"""

import sys
import os
import json
from datetime import datetime
from groq import Groq

# === Groq API Key from environment variable ===
GROQ_API_KEY_Pregnancy = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY_Pregnancy:
    raise ValueError("GROQ_API_KEY not found in environment variables")

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY_Pregnancy)

# === Core Function ===
def get_baby_recommendations(baby_age_months, baby_data, model="llama-3.3-70b-versatile"):
    """
    Generate personalized baby development recommendations using Groq

    Parameters:
    - baby_age_months: int (0-36 months)
    - baby_data: dict containing baby's information
    - model: Groq model to use

    Returns:
    - dict with status, recommendations, and metadata
    """
    prompt = f"""You are an expert pediatric development advisor providing evidence-based recommendations for newborns and infants.

Baby's Age: {baby_age_months} months old
Baby's Information:
- Weight: {baby_data.get('weight', 'Not provided')} kg
- Height: {baby_data.get('height', 'Not provided')} cm
- Gender: {baby_data.get('gender', 'Not specified')}
- Birth Weight: {baby_data.get('birth_weight', 'Not provided')} kg
- Feeding Type: {baby_data.get('feeding_type', 'Not specified')}
- Health Concerns: {', '.join(baby_data.get('health_concerns', [])) or 'None'}
- Current Milestones Achieved: {', '.join(baby_data.get('milestones_achieved', [])) or 'None'}

Please provide comprehensive recommendations in these categories:

1. DEVELOPMENTAL MILESTONES
2. NUTRITION AND FEEDING
3. ACTIVITIES AND STIMULATION
4. SLEEP PATTERNS
5. HEALTH AND SAFETY
6. PARENT TIPS

Be practical, specific, and supportive."""
    
    try:
        # Call Groq API
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a pediatric development expert."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=3500,
            top_p=1
        )

        recommendations = response.choices[0].message.content

        return {
            "status": "success",
            "baby_age_months": baby_age_months,
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat(),
            "model_used": model,
            "baby_info": baby_data,
            "tokens_used": response.usage.total_tokens,
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens
        }

    except Exception as e:
        return {
            "status": "error",
            "baby_age_months": baby_age_months,
            "error_message": str(e),
            "error_type": type(e).__name__,
            "timestamp": datetime.now().isoformat()
        }

# === Helper Function ===
def predict_baby_recommendations(age_months, weight=None, height=None,
                                  gender="not specified", birth_weight=None,
                                  feeding_type="breast milk",
                                  health_concerns=None, milestones_achieved=None):
    """
    Simplified interface for generating baby recommendations
    """
    if health_concerns is None:
        health_concerns = []
    if milestones_achieved is None:
        milestones_achieved = []

    baby_data = {
        "weight": weight,
        "height": height,
        "gender": gender,
        "birth_weight": birth_weight,
        "feeding_type": feeding_type,
        "health_concerns": health_concerns,
        "milestones_achieved": milestones_achieved
    }

    return get_baby_recommendations(age_months, baby_data)

# === Main Execution (for Node.js spawn) ===
if __name__ == "__main__":
    try:
        input_data = json.loads(sys.argv[1])

        result = predict_baby_recommendations(
            age_months=input_data.get("age_months"),
            weight=input_data.get("weight"),
            height=input_data.get("height"),
            gender=input_data.get("gender", "not specified"),
            birth_weight=input_data.get("birth_weight"),
            feeding_type=input_data.get("feeding_type", "breast milk"),
            health_concerns=input_data.get("health_concerns", []),
            milestones_achieved=input_data.get("milestones_achieved", [])
        )

        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "error_message": str(e),
            "error_type": type(e).__name__,
            "timestamp": datetime.now().isoformat()
        }))
