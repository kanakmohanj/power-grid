from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from pymongo import MongoClient
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "complaint_db")

mongo = MongoClient(MONGODB_URL)
db = mongo[DB_NAME]
docs = db["complaints"]


QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = os.getenv("COLLECTION_NAME", "complaints")

qdrant = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    timeout=60,
    https=True
)


EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
model = SentenceTransformer(EMBEDDING_MODEL)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-latest")