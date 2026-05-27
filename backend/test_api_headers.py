import sys
sys.path.insert(0, "c:/lysa/questionwhiz-standalone/backend")

from fastapi.testclient import TestClient
from main import app, verify_token

# Override the authentication dependency to bypass Supabase JWT validation
app.dependency_overrides[verify_token] = lambda: {"aud": "authenticated", "email": "test@example.com"}

client = TestClient(app)

print("--- TESTING API ROUTE HEADER PARSING ---")

# Simulate the exact call structure sent from the frontend:
# 1. Selected Provider: Groq
# 2. Custom API Key: gsk_test_api_key_long_enough_value
# 3. Model: llama-3.3-70b-versatile
headers = {
    "X-Selected-Provider": "Groq",
    "X-Selected-Api-Key": "gsk_test_api_key_long_enough_value",
    "X-Selected-Model": "llama-3.3-70b-versatile",
    "X-Model-Temperature": "0.2",
    "X-Model-Max-Output": "4096"
}

# Use dummy file and form data
files = {
    "files": ("test.txt", b"This is a test document to generate questions from. We want to test if headers are parsed correctly.")
}
data = {
    "subject": "General",
    "qp_pat": "MCQ",
    "topics": "General",
    "num_questions": 1,
    "bloom_level": "Not Specified",
    "difficulty": "Easy",
    "num_options": 4,
    "option_type": "alphabetical",
    "provide_answer": "Yes",
    "explanation": "Not required"
}

response = client.post("/api/query-with-pdf/", files=files, data=data, headers=headers)
print("Status:", response.status_code)
print("Response:", response.text)
