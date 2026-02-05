
import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load keys
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(env_path)

raw_keys = os.getenv('GEMINI_API_KEY')
keys = [k.strip() for k in raw_keys.split(',')]
primary_key = keys[0]

genai.configure(api_key=primary_key)

print("\n--- Testing Model: models/gemini-flash-latest ---")
try:
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Hi", generation_config=genai.types.GenerationConfig(max_output_tokens=10))
    print(f"Response success: {response.text}")
except Exception as e:
    print(f"Error testing gemini-flash-latest: {e}")

print("\n--- Testing Model: models/gemini-2.0-flash ---")
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content("Hi", generation_config=genai.types.GenerationConfig(max_output_tokens=10))
    print(f"Response success: {response.text}")
except Exception as e:
    print(f"Error testing gemini-2.0-flash: {e}")
