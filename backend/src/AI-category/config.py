from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGODB_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "complaints_db"

CATEGORY_THRESHOLD = 0.55 

