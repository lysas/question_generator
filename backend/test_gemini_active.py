import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("\n--- Trying gemini-1.5-flash-latest ---")
try:
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    res = model.generate_content("Say hello in one word")
    print(f"Success gemini-1.5-flash-latest: {res.text.strip()}")
except Exception as e:
    print(f"Error gemini-1.5-flash-latest: {e}")

print("\n--- Trying gemini-flash-latest ---")
try:
    model = genai.GenerativeModel("gemini-flash-latest")
    res = model.generate_content("Say hello in one word")
    print(f"Success gemini-flash-latest: {res.text.strip()}")
except Exception as e:
    print(f"Error gemini-flash-latest: {e}")
