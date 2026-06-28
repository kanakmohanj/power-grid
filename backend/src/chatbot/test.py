"""
Debug Gemini API key issues
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print("🔍 Gemini API Key Debugger")
print("=" * 60)

# Check 1: API key exists
if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not found in environment")
    print("💡 Make sure .env file exists and has GEMINI_API_KEY=...")
    exit(1)

print(f"✅ API Key found: {GEMINI_API_KEY[:15]}...{GEMINI_API_KEY[-5:]}")
print(f"   Length: {len(GEMINI_API_KEY)} characters")

# Check 2: API key format
if not GEMINI_API_KEY.startswith("AIza"):
    print("⚠️  API key doesn't start with 'AIza' - this might be wrong")
else:
    print("✅ API key format looks correct (starts with 'AIza')")

# Check 3: Whitespace
if GEMINI_API_KEY != GEMINI_API_KEY.strip():
    print("⚠️  API key has leading/trailing whitespace")
    print(f"   Before: '{GEMINI_API_KEY}'")
    print(f"   After:  '{GEMINI_API_KEY.strip()}'")
else:
    print("✅ No whitespace issues")

print()

# Check 4: Test API key with list models (simpler endpoint)
print("🧪 Test 1: List Models Endpoint")
print("-" * 60)

list_url = f"https://generativelanguage.googleapis.com/v1/models?key={GEMINI_API_KEY.strip()}"

try:
    response = requests.get(list_url, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ API key is VALID and working!")
        models = response.json().get("models", [])
        print(f"   Available models: {len(models)}")
    elif response.status_code == 403:
        print("❌ API key is INVALID or RESTRICTED")
        error_detail = response.json()
        print(f"\nError details:")
        print(response.text)
    elif response.status_code == 400:
        print("⚠️  Bad request")
        print(response.text)
    else:
        print(f"⚠️  Unexpected status: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Request failed: {e}")

print()

# Check 5: Test with generateContent
print("🧪 Test 2: Generate Content Endpoint")
print("-" * 60)

gen_url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY.strip()}"

payload = {
    "contents": [{"role": "user", "parts": [{"text": "Hi"}]}]
}

try:
    response = requests.post(gen_url, json=payload, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Generate content working!")
        result = response.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        print(f"   Response: {text}")
    elif response.status_code == 403:
        print("❌ API key access denied for generateContent")
        print("\nPossible reasons:")
        print("1. API key is for a different project")
        print("2. Gemini API not enabled in your Google Cloud project")
        print("3. API key restrictions are too strict")
        print("4. Billing not enabled (if required)")
        print("\n📋 Error response:")
        print(response.text)
    elif response.status_code == 404:
        print("❌ Model not found")
        print("   Try: gemini-2.0-flash or gemini-1.5-flash")
    else:
        print(f"⚠️  Status {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Request failed: {e}")

print()
print("=" * 60)
print("💡 Recommendations:")
print("=" * 60)

# Based on the tests, provide recommendations
if GEMINI_API_KEY.strip().startswith("AIza"):
    print("1. ✅ Your API key format is correct")
    print("2. 🔍 If both tests failed with 403:")
    print("   - Go to: https://aistudio.google.com/apikey")
    print("   - Delete the old key")
    print("   - Create a NEW API key")
    print("   - Copy it EXACTLY (no spaces)")
    print("   - Update .env file")
    print("3. 🔍 If Test 1 worked but Test 2 failed:")
    print("   - Your key is valid but restricted")
    print("   - Check API restrictions in Google Cloud Console")
    print("4. 🔍 Make sure Gemini API is enabled:")
    print("   - Go to: https://console.cloud.google.com/apis/library")
    print("   - Search for 'Generative Language API'")
    print("   - Click 'Enable'")
else:
    print("❌ Your API key format looks wrong")
    print("   - Should start with 'AIza'")
    print("   - Get a new one from: https://aistudio.google.com/apikey")