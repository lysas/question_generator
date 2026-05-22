import os, json, datetime
from dotenv import load_dotenv
load_dotenv()
from supabase_client import SupabaseWriter

def main():
    try:
        writer = SupabaseWriter()
        print("Connected to PostgreSQL Database")
    except Exception as e:
        print(f"Failed to connect: {e}")
        return

    dummy = {
        "user_main_id": "test_id",
        "user_id": "test_id",
        "user_email": "test@example.com",
        "source": "cli_test",
        "prompt": "dummy prompt",
        "response": json.dumps({"question": "What is 2+2?"}),
        "model": "openai",
        "cost": 0.0,
        "tokens": json.dumps({"prompt": 5, "completion": 3}),
        "created_at": datetime.datetime.utcnow().isoformat()
    }

    try:
        resp = writer.insert_question(dummy)
        print("Insert succeeded:", resp)
    except Exception as e:
        print("Insert failed:", str(e))

if __name__ == "__main__":
    main()
