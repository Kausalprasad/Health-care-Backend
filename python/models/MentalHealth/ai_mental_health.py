# ai_mental_health.py
# -*- coding: utf-8 -*-
import re
from google import generativeai as genai

class Chain:
    def __init__(self, memory_limit: int = 5):
        # Configure Gemini API once
        genai.configure(api_key="AIzaSyCZVnNAj3rdn7B0dtywmv5i0rEjaoqJmqA")  # 👈 apna sahi key daalna
        self.model = genai.GenerativeModel("gemini-2.5-flash")

        self.system_prompt = (
            "You are an empathetic, supportive therapist with 10+ years of experience.\n"
            "Specialties: CBT, active listening, stress management, resilience, relationships.\n\n"
            "Guidelines:\n"
            "- Validate emotions before guiding.\n"
            "- Ask reflective, open-ended questions.\n"
            "- Offer coping tools and encouragement.\n"
            "- Avoid diagnosing/medical advice.\n"
            "- Provide crisis resources if self-harm is detected.\n\n"
            "At the end of a session, provide a summary with 2–3 coping strategies and encouragement."
        )

        self.history = []
        self.memory_limit = memory_limit
        self.turn_count = 0

        self.crisis_patterns = [
            re.compile(p, re.IGNORECASE)
            for p in [
                r"\b(suicid(e|al))\b",
                r"\b(kill myself)\b",
                r"\b(end my life)\b",
                r"\b(self[- ]?harm)\b",
                r"\b(cutting|cut myself)\b",
                r"\b(hurt myself)\b",
                r"\b(don't want to live)\b",
                r"\b(can't go on)\b",
                r"\b(worthless|hopeless)\b",
            ]
        ]

    def detect_crisis(self, text: str) -> bool:
        return any(pattern.search(text) for pattern in self.crisis_patterns)

    def crisis_message(self) -> str:
        return (
            "💙 I hear your pain, and I want you to know you’re not alone. "
            "If you are thinking about harming yourself, your safety is the most important thing right now.\n\n"
            "👉 Call your local emergency number if you feel unsafe.\n"
            "👉 In the U.S., dial or text **988** (Suicide & Crisis Lifeline).\n"
            "👉 Outside the U.S., please look up your local crisis hotline.\n\n"
            "You are deeply valued, and reaching out for help is a brave step. 💙"
        )

    def build_prompt(self, user_input: str, concluding: bool = False) -> str:
        convo = "\n".join(
            f"User: {h['user']}\nTherapist: {h['therapist']}"
            for h in self.history
        )
        convo += f"\nUser: {user_input}\nTherapist:"

        if concluding:
            instructions = (
                "Now, provide a **conclusion**:\n"
                "- Summarize key emotions/themes.\n"
                "- Validate warmly.\n"
                "- Share 2–3 coping strategies or reframes.\n"
                "- End with encouragement + reminder that professional support is available."
            )
        else:
            instructions = (
                "Continue the conversation:\n"
                "- Respond with empathy and validation.\n"
                "- Ask reflective, open-ended questions.\n"
                "- Offer gentle guidance or coping tools."
            )

        return f"{self.system_prompt}\n\nConversation so far:\n{convo}\n\n{instructions}"

    def get_summary_chain(self, user_input: str) -> str:
        try:
            if self.detect_crisis(user_input):
                return self.crisis_message()

            self.turn_count += 1
            concluding = self.turn_count >= self.memory_limit

            prompt = self.build_prompt(user_input, concluding)
            response = self.model.generate_content(prompt).text.strip()

            self.history.append({"user": user_input, "therapist": response})
            if len(self.history) > self.memory_limit:
                self.history.pop(0)

            if concluding:
                self.turn_count = 0
                self.history.clear()

            return response

        except Exception as e:
            return f"⚠️ AI error: {str(e)}"

if __name__ == "__main__":
    print("This file contains the AI therapist model. Use mental_health_runner.py")
