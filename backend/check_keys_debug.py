
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Simulate what settings.py does
BASE_DIR = Path(__file__).resolve().parent

# Try loading generic
load_dotenv()
print(f"Generic load - OPENAI_API_KEY: {os.getenv('OPENAI_API_KEY')}")

# Try loading specific
env_path = BASE_DIR / '.env'
print(f"Checking path: {env_path}")
print(f"File exists: {env_path.exists()}")

load_dotenv(env_path)
print(f"Specific load - OPENAI_API_KEY: {os.getenv('OPENAI_API_KEY')}")
print(f"Specific load - ANTHROPIC_API_KEY: {os.getenv('ANTHROPIC_API_KEY')}")
print(f"Specific load - GEMINI_API_KEY: {os.getenv('GEMINI_API_KEY')}")
