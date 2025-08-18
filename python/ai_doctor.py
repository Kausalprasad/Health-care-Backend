# -*- coding: utf-8 -*-
from typing import List
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
import sys
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class MedicalAdvice(BaseModel):
    condition: str
    description: str
    precautions: List[str]
    home_remedies: List[str]
    medicines: List[str]
    dosage_instructions: List[str]

class AIDoctor:
    def __init__(self):
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.llm = ChatGroq(
            temperature=0,
            groq_api_key=groq_key,
            model_name="llama-3.3-70b-versatile"
        )

    def get_advice(self, symptoms: str, age_group: str = "adult", medical_conditions: List[str] = None, gender: str = "unspecified"):
        if medical_conditions is None:
            medical_conditions = []
        parser = JsonOutputParser(pydantic_object=MedicalAdvice)
        prompt = PromptTemplate.from_template("""
        You are an AI Health Assistant.
        Based on the user's symptoms, age group, gender, and medical history, provide safe, personalized health advice in JSON format.

        👤 User Profile:
        - Age Group: {age_group}
        - Gender: {gender}
        - Medical Conditions: {medical_conditions}

        ✅ Instructions:
        - Only suggest OTC (over-the-counter) medicines and safe home remedies.
        - Adapt advice to account for listed medical conditions.
        - Include a short, friendly message in a `note` field.
        - Avoid unsafe medicines for conditions like asthma, pregnancy, heart issues, diabetes, etc.
        - If unsure, suggest seeing a doctor.

        📝 Your response must be in this exact JSON format:

        {{
          "note": "<Friendly message>",
          "condition": "<Likely condition name>",
          "description": "<Short explanation>",
          "precautions": ["..."],
          "home_remedies": ["..."],
          "medicines": ["..."],
          "dosage_instructions": ["..."]
        }}

        👤 USER SYMPTOMS:
        {input}

        📌 FORMAT INSTRUCTIONS:
        {format_instructions}
        """)

        formatted_prompt = prompt.format(
            input=symptoms,
            age_group=age_group,
            gender=gender,
            medical_conditions=", ".join(medical_conditions),
            format_instructions=parser.get_format_instructions()
        )

        try:
            response = self.llm.invoke(formatted_prompt)
            result = parser.parse(response.content)
            return result
        except OutputParserException as e:
            return {"error": "Output parsing failed", "details": str(e)}
        except Exception as e:
            return {"error": "Unexpected error", "details": str(e)}

if __name__ == "__main__":
    symptoms = sys.argv[1]
    age_group = sys.argv[2]
    gender = sys.argv[3]
    medical_conditions = sys.argv[4].split(",") if sys.argv[4] else []

    doctor = AIDoctor()
    advice = doctor.get_advice(symptoms, age_group=age_group, gender=gender, medical_conditions=medical_conditions)

    if isinstance(advice, dict):
        print(json.dumps(advice))
    else:
        print(advice.json())
