
import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load keys
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(env_path)

raw_keys = os.getenv('GEMINI_API_KEY')
if not raw_keys:
    print("No GEMINI_API_KEY found")
    exit()

keys = [k.strip() for k in raw_keys.split(',')]
primary_key = keys[0]

print(f"Testing primary key (ending in {primary_key[-4:]})")
genai.configure(api_key=primary_key)

print("\n--- Listing Models ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Model: {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")

print("\n--- Testing Model: models/gemini-1.5-flash ---")
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hi", generation_config=genai.types.GenerationConfig(max_output_tokens=10))
    print(f"Response success: {response.text}")
except Exception as e:
    print(f"Error testing gemini-1.5-flash: {e}")

print("\n--- Testing Model: models/gemini-1.5-flash-latest ---")
try:
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    response = model.generate_content("Hi", generation_config=genai.types.GenerationConfig(max_output_tokens=10))
    print(f"Response success: {response.text}")
except Exception as e:
    print(f"Error testing gemini-1.5-flash-latest: {e}")
