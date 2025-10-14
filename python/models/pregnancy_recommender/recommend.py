# -*- coding: utf-8 -*-
import os
import json
import sys
from datetime import datetime
from groq import Groq

GROQ_API_KEY_Pregnancy = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE")
client = Groq(api_key=GROQ_API_KEY_Pregnancy)

def get_pregnancy_recommendations(pregnancy_month, maternal_data, model="llama-3.3-70b-versatile"):
    prompt = f"""
You are an expert pregnancy health advisor.

Pregnancy Month: {pregnancy_month}
Mother Info:
- Age: {maternal_data.get('age')}
- Weight: {maternal_data.get('weight')}
- Height: {maternal_data.get('height')}
- Conditions: {', '.join(maternal_data.get('conditions', [])) or 'None'}
- Symptoms: {', '.join(maternal_data.get('symptoms', [])) or 'None'}
- Diet Type: {maternal_data.get('diet_type')}
- Activity Level: {maternal_data.get('activity_level')}

Provide structured recommendations under:
1. Maternal Health
2. Nutrition & Diet
3. Physical Activity
4. Fetal Development
5. Lifestyle & Stress
6. Preparations for Baby
"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a pregnancy health advisor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=3000
        )
        rec = response.choices[0].message.content
        return {
            "status": "success",
            "month": pregnancy_month,
            "recommendations": rec,
            "maternal_info": maternal_data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "timestamp": datetime.now().isoformat()}


def predict_pregnancy_recommendations(month, age, weight, height,
                                      conditions=None, symptoms=None,
                                      diet_type="regular", activity_level="moderate"):
    maternal_data = {
        "age": age,
        "weight": weight,
        "height": height,
        "conditions": conditions or [],
        "symptoms": symptoms or [],
        "diet_type": diet_type,
        "activity_level": activity_level
    }
    return get_pregnancy_recommendations(month, maternal_data)


if __name__ == "__main__":
    try:
        input_json = json.loads(sys.argv[1])
        result = predict_pregnancy_recommendations(
            month=input_json.get("month"),
            age=input_json.get("age"),
            weight=input_json.get("weight"),
            height=input_json.get("height"),
            conditions=input_json.get("conditions"),
            symptoms=input_json.get("symptoms"),
            diet_type=input_json.get("diet_type", "regular"),
            activity_level=input_json.get("activity_level", "moderate")
        )
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))
