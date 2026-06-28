import uuid
from config import docs, model, qdrant, COLLECTION_NAME
from qdrant_client import models
from qdrant_client.models import PointStruct
from vector_sync import get_searchable_text

print(f"🚀 Backfilling collection '{COLLECTION_NAME}' → Qdrant")

if qdrant.collection_exists(COLLECTION_NAME):
    print("⚠️ Collection exists → deleting")
    qdrant.delete_collection(collection_name=COLLECTION_NAME)

print("✅ Creating collection")
qdrant.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=models.VectorParams(
        size=384,                   
        distance=models.Distance.COSINE
    )
)

count = 0

for doc in docs.find():
    mongo_id = str(doc["_id"])

    text = get_searchable_text(doc)
    if not text.strip():
        continue

    vector = model.encode(text).tolist()

    point = PointStruct(
        id=mongo_id, 
        vector=vector,
        payload={
            "doc_id": mongo_id,   
            "tenant_id": str(doc.get("tenantId")),  # ✅ Store as string for consistent filtering

            "submitted_by": str(doc.get("submitted_by", "")),
            "assigned_to": str(doc.get("assigned_to", "")),

            "title": doc.get("title", "Untitled Complaint"),
            "category": doc.get("category", "General"),
            "priority": doc.get("priority", "Low"),
            "status": doc.get("status", "Open"),
        }
    )
    
    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[point],
        wait=True
    )

    count += 1
    print(f"✅ [{count}] Indexed → {doc.get('title', 'Untitled')} | Tenant: {doc.get('tenantId')}")

print(f"\n🎉 Backfill complete — {count} documents indexed.")