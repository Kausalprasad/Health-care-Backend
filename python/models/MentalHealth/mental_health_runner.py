# mental_health_runner.py
import sys
import json
from ai_mental_health import Chain

# Load model once globally
MODEL = Chain(memory_limit=3)
sessions = {}

def handle_message(session_id, message):
    if session_id not in sessions:
        sessions[session_id] = MODEL
    chat = sessions[session_id]
    reply = chat.get_summary_chain(message)
    return reply

# Persistent stdin loop
for line in sys.stdin:
    try:
        if not line.strip():
            continue
        data = json.loads(line)
        session_id = data.get("sessionId", "default")
        user_message = data.get("message", "")

        reply = handle_message(session_id, user_message)

        # Always flush stdout
        print(json.dumps({"reply": reply}))
        sys.stdout.flush()
    except Exception as e:
        print(json.dumps({"reply": f"⚠️ Python Error: {str(e)}"}))
        sys.stdout.flush()
