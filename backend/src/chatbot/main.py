from fastapi import FastAPI
from contextlib import asynccontextmanager
from pydantic import BaseModel

from rag_search import answer_question
from vector_sync import run_background_sync



@asynccontextmanager
async def lifespan(app: FastAPI):
    print("RAG service starting... Syncing MongoDB → Qdrant")
    run_background_sync()   # Starts the background sync thread
    yield
    print("RAG service stopped.")


app = FastAPI(
    lifespan=lifespan,
    title="RAG Chatbot – testdb.users → Qdrant → Gemini",
    description="Always-up-to-date semantic search over your MongoDB complaints"
)



class AskRequest(BaseModel):
    question: str
    tenant_id: str
    role: str
    user_id: str | None = None



@app.post("/ask")
async def ask(req: AskRequest):
    answer = answer_question(
        query=req.question,
        tenant_id=req.tenant_id,
        role=req.role,
        user_id=req.user_id
    )
    return {"answer": answer}



@app.get("/")
async def root():
    return {"status": "RAG service is running and fully synced!"}