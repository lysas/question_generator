import os
import sys

# Add backend directory to sys.path to import modules
sys.path.insert(0, "c:/lysa/questionwhiz-standalone/backend")

from main import get_ai_provider_and_key, format_provider_error

# Configure dummy environment keys
os.environ["GEMINI_API_KEY"] = "AIzaSyDummyGeminiKey12345"
os.environ["OPENAI_API_KEY"] = "sk-proj-dummy-openai-key-value-12345"
if "GROK_API_KEY" in os.environ:
    del os.environ["GROK_API_KEY"]

print("--- RUNNING TESTS FOR API KEY RESOLUTION & FALLBACKS ---")

# Test case 1: Selected provider has a valid user key
provider, key = get_ai_provider_and_key(
    x_openai_key=None,
    x_gemini_key=None,
    x_selected_provider="openai",
    x_selected_api_key="sk-proj-user-key-value-99999"
)
assert provider == "openai" and key == "sk-proj-user-key-value-99999", f"Failed Case 1: Got {provider}, {key}"
print("Test Case 1 passed: Valid custom key resolved successfully.")

# Test case 2: Selected provider (Groq) has no user key, no environment key, should fallback to default Gemini key
provider, key = get_ai_provider_and_key(
    x_openai_key=None,
    x_gemini_key=None,
    x_selected_provider="Groq",
    x_selected_api_key=""
)
assert provider == "gemini" and key == "AIzaSyDummyGeminiKey12345", f"Failed Case 2: Got {provider}, {key}"
print("Test Case 2 passed: Auto-fallback to default server key when selected provider has no key.")

# Test case 3: Selected provider is Mistral, has placeholder key, should fallback to default Gemini key
provider, key = get_ai_provider_and_key(
    x_openai_key=None,
    x_gemini_key=None,
    x_selected_provider="Mistral",
    x_selected_api_key="****************"
)
assert provider == "gemini" and key == "AIzaSyDummyGeminiKey12345", f"Failed Case 3: Got {provider}, {key}"
print("Test Case 3 passed: Placeholder keys correctly ignored and fell back to default server key.")

# Test case 4: Format invalid key error
err = Exception("Groq API call failed: Unauthorized access, invalid api key provided.")
formatted = format_provider_error("Groq", err)
assert "Invalid API Key" in formatted, f"Failed Case 4: Got {formatted}"
print("Test Case 4 passed: Unauthorized error correctly formatted as Invalid API Key.")

# Test case 5: Format rate limit error
err2 = Exception("Gemini API call failed: 429 Resource Exhausted. Rate limit exceeded.")
formatted2 = format_provider_error("Gemini", err2)
assert "Rate limit or quota exceeded" in formatted2, f"Failed Case 5: Got {formatted2}"
print("Test Case 5 passed: Rate limit error correctly formatted as Rate limit exceeded.")

print("ALL TESTS PASSED SUCCESSFULLY!")

# FastAPI TestClient Test
from fastapi.testclient import TestClient
from main import app, verify_token

app.dependency_overrides[verify_token] = lambda: {"aud": "authenticated", "email": "test@example.com"}
client = TestClient(app)

print("\n--- RUNNING FASTAPI TESTCLIENT HEADER CHECK ---")
headers = {
    "X-Selected-Provider": "Groq",
    "X-Selected-Api-Key": "gsk_test_api_key_long_enough_value_123456789",
    "X-Selected-Model": "llama-3.3-70b-versatile"
}
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
print("Status Code:", response.status_code)
print("Response:", response.text)
