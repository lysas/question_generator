import google.generativeai as genai
import os
import sys

# Try to get API key from environment variable
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY environment variable not set!")
    sys.exit(1)

genai.configure(api_key=api_key)

print("Listing models:")
try:
    for m in genai.list_models():
        print(f"Name: {m.name}, Supported operations: {m.supported_generation_methods}")
except Exception as e:
    print(f"Error listing models: {e}")

print("\nTrying to generate content with gemini-1.5-flash:")
try:
    model = genai.GenerativeModel("gemini-1.5-flash")
    res = model.generate_content("Say hello in one word")
    print(f"Success: {res.text}")
except Exception as e:
    print(f"Error with gemini-1.5-flash: {e}")

print("\nTrying to generate content with models/gemini-1.5-flash:")
try:
    model = genai.GenerativeModel("models/gemini-1.5-flash")
    res = model.generate_content("Say hello in one word")
    print(f"Success: {res.text}")
except Exception as e:
    print(f"Error with models/gemini-1.5-flash: {e}")
