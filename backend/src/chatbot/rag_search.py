from config import model, qdrant, docs, COLLECTION_NAME, GEMINI_API_KEY, GEMINI_MODEL
from bson import ObjectId
from qdrant_client import models
import requests


def search_qdrant(
    query: str,
    tenant_id: str,
    role: str,
    user_id: str | None = None,
    top_k: int = 5
):
    query_vec = model.encode(query).tolist()

    must_filters = [
        models.FieldCondition(
            key="tenant_id",
            match=models.MatchValue(value=str(tenant_id))
        )
    ]

    if role == "staff" and user_id:
        must_filters.append(
            models.FieldCondition(
                key="assigned_to",
                match=models.MatchValue(value=str(user_id))
            )
        )
    elif role == "citizen" and user_id:
        must_filters.append(
            models.FieldCondition(
                key="submitted_by",
                match=models.MatchValue(value=str(user_id))
            )
        )

    query_filter = models.Filter(must=must_filters)

    hits = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vec,
        query_filter=query_filter,
        limit=top_k,
        with_payload=True
    )
   
    contexts = []
    for hit in hits.points:
        if not hit.payload or "doc_id" not in hit.payload:
            continue

        doc = docs.find_one({"_id": ObjectId(hit.payload["doc_id"])})
        if not doc:
            continue

        formatted_text = (
            f"Title: {doc.get('title', 'Untitled')}\n"
            f"Category: {doc.get('category', 'General')} | "
            f"Priority: {doc.get('priority', 'Low')} | "
            f"Status: {doc.get('status', 'Open')}\n"
            f"Description: {doc.get('description', '')}\n"
            f"Remarks: {doc.get('remarks', '')}"
        )

        contexts.append({
            "filename": doc.get("title", "Untitled"),
            "content": formatted_text,
            "score": hit.score
        })

    return contexts


def get_database_context(tenant_id: str, role: str, user_id: str | None = None):
    """Get ALL relevant information from the database with proper multi-tenancy"""
    
    # ✅ FIX: Build filter with proper ObjectId conversion for MongoDB
    try:
        # Try to convert tenant_id to ObjectId if it's a valid ObjectId string
        filter_query = {"tenantId": ObjectId(tenant_id)}
    except:
        # If not a valid ObjectId, use as string
        filter_query = {"tenantId": tenant_id}
    
    if role == "staff" and user_id:
        try:
            filter_query["assigned_to"] = ObjectId(user_id)
        except:
            filter_query["assigned_to"] = user_id
    elif role == "citizen" and user_id:
        try:
            filter_query["submitted_by"] = ObjectId(user_id)
        except:
            filter_query["submitted_by"] = user_id
    
    # Get all complaints with multi-tenancy filter
    complaints = list(docs.find(filter_query))
    
    if not complaints:
        return f"No complaints found for tenant_id={tenant_id}, role={role}, user_id={user_id}"
    
    # Build comprehensive context
    context_parts = []
    
    # Statistics
    total = len(complaints)
    stats = {
        "by_status": {},
        "by_priority": {},
        "by_category": {}
    }
    
    for complaint in complaints:
        status = complaint.get("status", "Open")
        priority = complaint.get("priority", "Low")
        category = complaint.get("category", "General")
        
        stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
        stats["by_priority"][priority] = stats["by_priority"].get(priority, 0) + 1
        stats["by_category"][category] = stats["by_category"].get(category, 0) + 1
    
    context_parts.append(f"TOTAL COMPLAINTS: {total}")
    context_parts.append(f"\nSTATUS BREAKDOWN: {dict(stats['by_status'])}")
    context_parts.append(f"PRIORITY BREAKDOWN: {dict(stats['by_priority'])}")
    context_parts.append(f"CATEGORY BREAKDOWN: {dict(stats['by_category'])}")
    
    # Get unique users/staff
    all_staff = set()
    all_citizens = set()
    
    for complaint in complaints:
        if complaint.get("assigned_to"):
            all_staff.add(str(complaint.get("assigned_to")))
        if complaint.get("submitted_by"):
            all_citizens.add(str(complaint.get("submitted_by")))
    
    context_parts.append(f"\nTOTAL STAFF MEMBERS: {len(all_staff)}")
    context_parts.append(f"STAFF IDs: {list(all_staff)}")
    context_parts.append(f"\nTOTAL CITIZENS (USERS): {len(all_citizens)}")
    context_parts.append(f"CITIZEN IDs: {list(all_citizens)}")
    
    # Add sample complaints
    context_parts.append("\n\nRECENT COMPLAINTS:")
    for i, complaint in enumerate(complaints[:10], 1):
        context_parts.append(
            f"\n[{i}] Title: {complaint.get('title', 'Untitled')}\n"
            f"    Category: {complaint.get('category', 'General')} | "
            f"Priority: {complaint.get('priority', 'Low')} | "
            f"Status: {complaint.get('status', 'Open')}\n"
            f"    Submitted by: {complaint.get('submitted_by', 'Unknown')}\n"
            f"    Assigned to: {complaint.get('assigned_to', 'Unassigned')}\n"
            f"    Description: {complaint.get('description', '')[:100]}..."
        )
    
    return "\n".join(context_parts)


def is_greeting(query: str) -> bool:
    """Check if the query is a simple greeting"""
    greetings = ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening"]
    return query.lower().strip() in greetings


def call_gemini(prompt: str) -> str:
    url = (
        f"https://generativelanguage.googleapis.com/v1/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY.strip()}"
    )

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"AI Error: {e}"


def answer_question(
    query: str,
    tenant_id: str,
    role: str,
    user_id: str | None = None
) -> str:
    
    # Handle greetings ONLY
    if is_greeting(query):
        return "Hello! I'm your admin assistant. I can help you with information about complaints, users, and staff from your database. What would you like to know?"
    
    # ✅ FIX: Get complete database context with proper multi-tenancy
    db_context = get_database_context(tenant_id, role, user_id)
    
    # ✅ DEBUG: Log what we're getting
    print(f"\n🔍 DEBUG - Query: {query}")
    print(f"🔍 DEBUG - Tenant: {tenant_id}, Role: {role}, User: {user_id}")
    print(f"🔍 DEBUG - Context length: {len(db_context)} chars")
    print(f"🔍 DEBUG - Context preview: {db_context[:500]}...\n")
    
    prompt = f"""
    You are an admin assistant. Answer the question using ONLY the database information below.
    
    STRICT RULES:
    - Answer ONLY based on the data provided below
    - If the data doesn't contain the answer, say "I don't have that information in the database"
    - DO NOT make up information or use outside knowledge
    - Be helpful and conversational
    - If you see "No complaints found", tell the user there's no data for their tenant
    
    DATABASE INFORMATION:
    {db_context}
    
    USER QUESTION: {query}
    
    Answer based ONLY on the database information above:
    """

    return call_gemini(prompt)