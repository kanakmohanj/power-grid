import re
import numpy as np
from fastembed import TextEmbedding
import google.generativeai as genai
from config import GEMINI_API_KEY, CATEGORY_THRESHOLD

# -------------------------------
# Gemini setup
# -------------------------------
genai.configure(api_key=GEMINI_API_KEY)
gemini = genai.GenerativeModel("gemini-2.5-flash")

# -------------------------------
# FastEmbed setup
# -------------------------------
embedder = TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5",
    max_length=512
)

# -------------------------------
# Categories
# -------------------------------
CATEGORIES = ["Infrastructure", "Sanitation", "Water", "Electricity"]

def embed(text: str) -> np.ndarray:
    return next(embedder.embed([text]))

cat_embs = {cat: embed(cat) for cat in CATEGORIES}

# -------------------------------
# Keyword mapping (UNCHANGED)
# -------------------------------
KEYWORD_MAPPING = {
    "water": "Water",
    "leak": "Water", "pipe": "Water", "tap": "Water", "flood": "Water", "no water": "Water", "jal": "Water",

    "light": "Electricity", "electricity": "Electricity", "power": "Electricity", "bijli": "Electricity",
    "current": "Electricity", "bulb": "Electricity", "wire": "Electricity", "outage": "Electricity",

    "road": "Infrastructure", "pothole": "Infrastructure", "bridge": "Infrastructure",
    "drain": "Infrastructure", "manhole": "Infrastructure", "footpath": "Infrastructure",

    "garbage": "Sanitation", "kachra": "Sanitation", "dustbin": "Sanitation", "sewage": "Sanitation",
    "toilet": "Sanitation", "smell": "Sanitation", "waste": "Sanitation"
}


# Utils (UNCHANGED)

def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def simple_clean(title: str) -> str:
    text = title.lower()

    for ch in ".,!?:;()[]'\"-":
        text = text.replace(ch, " ")
    words = text.split()

    clean_words = []
    for word in words:
        word = word.strip()
        if len(word) > 2:
            if word.endswith("ing"): word = word[:-3]
            if word.endswith("ed"):  word = word[:-2]
            if word.endswith("es"):  word = word[:-2]
            if word.endswith("s") and len(word) > 3: word = word[:-1]
            clean_words.append(word)

    return " ".join(clean_words)

# -------------------------------
# Category classifier (FastEmbed)
# -------------------------------
def get_category(title: str, description: str = "") -> str:
    text = f"{title} {description}".lower()


    # 1️ Keyword-first
    for keyword, cat in KEYWORD_MAPPING.items():
        if keyword in text:
            return cat

    # 2️ Embedding fallback
    cleaned = simple_clean(f"{title} {description}")
    if not cleaned:
        return "Others"

    emb = embed(cleaned)
    sims = {cat: cosine(emb, cat_embs[cat]) for cat in CATEGORIES}

    best_cat = max(sims, key=sims.get)
    best_score = sims[best_cat]

    return best_cat if best_score >= CATEGORY_THRESHOLD else "Others"

# -------------------------------
# Priority classifier - CAPITALIZED OUTPUT
# -------------------------------
def get_priority(description: str) -> str:
    low_keywords = [
        "suggestion", "suggest", "request", "please install", "please put", "please provide",
        "idea", "feedback", "opinion", "would be good", "better if", "kindly consider",
        "want", "wish", "hope", "new park", "new bench", "paint", "beautification",
        "tree", "plant", "garden", "playground", "swing", "slide"
    ]

    desc_lower = description.lower()

    if any(kw in desc_lower for kw in low_keywords):
        return "Low"  # Capitalized
    if "leak" in desc_lower or "leaking" in desc_lower:
        return "High"  # Capitalized
    if re.search(r"\b\d+\s*(day|days|week|weeks)\b", desc_lower):
        if "water" in desc_lower or "electricity" in desc_lower or "power" in desc_lower:
            return "High"  # Capitalized


    prompt = f"""
    You are a priority classifier for complaints. Classify the priority as 'high', 'medium', or 'low'.

    Description: "{description}"
    Return ONLY one word.
    """

    resp = gemini.generate_content(prompt)
    priority = resp.text.strip().lower()

    # Capitalize the result
    if priority == "high":
        return "High"
    elif priority == "medium":
        return "Medium"
    elif priority == "low":
        return "Low"
    else:
        return "Low"  # Default capitalized