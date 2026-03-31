import requests
import json
import os
from dotenv import load_dotenv
import sys

# Set encoding to UTF8
if sys.stdout.encoding != 'utf-8':
    try:
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except:
        pass

load_dotenv()
api_key = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found")
    exit(1)

def check_version(version):
    url = f"https://generativelanguage.googleapis.com/{version}/models?key={api_key}"
    try:
        print(f"\n🔍 Checking {version}...")
        response = requests.get(url)
        data = response.json()
        if "error" in data:
            print(f"  ❌ {data['error']['message']}")
            return
        
        models = data.get("models", [])
        bidi_models = [m.get("name") for m in models if "bidiGenerateContent" in m.get("supportedGenerationMethods", [])]
        
        if bidi_models:
            print(f"  ✅ Found {len(bidi_models)} BIDI models in {version}:")
            for m in bidi_models:
                print(f"    - {m}")
        else:
            print(f"  ⚠️ No BIDI models in {version}")
    except Exception as e:
        print(f"  ❌ Failed {version}: {str(e)}")

check_version("v1beta")
check_version("v1alpha")
