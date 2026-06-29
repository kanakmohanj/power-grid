
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict
from db import complaints
from processor import get_category, get_priority

app = FastAPI()

class ComplaintIn(BaseModel):
    model_config = ConfigDict(extra="allow")
    title: str
    description: str

@app.post("/submit")
async def submit(c: ComplaintIn):
    category = get_category(c.title,c.description)
    priority = get_priority(c.description)

    result = complaints.insert_one({
        **c.model_dump(),
        "category": category,
        "priority": priority
    })

    return {
        "id": str(result.inserted_id),
        "category": category,
        "priority": priority
    }
@app.get("/")
async def root():
    return {"status": "AI Category Predictor is running"}