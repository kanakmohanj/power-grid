import uuid
import logging
import threading
import time
from config import model, qdrant, docs, COLLECTION_NAME, mongo
from qdrant_client.models import PointStruct
from qdrant_client import models
from bson import ObjectId

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vector_sync")

def get_searchable_text(doc: dict) -> str:
    """
    Combine complaint fields into one context string for the LLM.
    """
    parts = [
        f"Title: {doc.get('title', '')}",
        f"Description: {doc.get('description', '')}",
        f"Category: {doc.get('category', '')}",
        f"Priority: {doc.get('priority', '')}",
        f"Status: {doc.get('status', '')}",
        f"Remarks: {doc.get('remarks', '')}"
    ]
    return " ".join(part for part in parts if part and not part.endswith(": ")).strip()

def upsert_vector(doc: dict):
    mongo_id = str(doc["_id"])

    text = get_searchable_text(doc)
    if not text.strip():
        return

    vector = model.encode(text).tolist()

    point = PointStruct(
        id=mongo_id,  # ✅ Use MongoDB ID as Qdrant point ID
        vector=vector,
        payload={
            "doc_id": mongo_id,

            # ✅ MULTI-TENANCY (CRITICAL)
            "tenant_id": str(doc.get("tenantId")),

            # ✅ OWNERSHIP
            "submitted_by": str(doc.get("submitted_by", "")),
            "assigned_to": str(doc.get("assigned_to", "")),

            # ✅ SEARCH METADATA
            "category": doc.get("category", "General"),
            "priority": doc.get("priority", "Low"),
            "status": doc.get("status", "Open"),
            "title": doc.get("title", "Untitled Complaint"),
        }
    )

    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=[point]
    )

    logger.info(f"✅ Vector synced | {mongo_id} | {doc.get('title')}")

def delete_vector(doc_id: str):
    """Delete vector by filtering on doc_id payload field"""
    qdrant.delete(
        collection_name=COLLECTION_NAME,
        points_selector=models.FilterSelector(
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="doc_id",
                        match=models.MatchValue(value=str(doc_id))
                    )
                ]
            )
        )
    )
    logger.info(f"🗑️ Deleted vector(s) for MongoID={doc_id}")

def handle_change(change):
    op = change["operationType"]
    doc_id_str = str(change["documentKey"]["_id"])

    if op in ["insert", "update", "replace"]:
        full_doc = change.get("fullDocument")
        if not full_doc:
            full_doc = docs.find_one({"_id": ObjectId(doc_id_str)})
        if full_doc:
            upsert_vector(full_doc)

    elif op == "delete":
        delete_vector(doc_id_str)

def check_replica_set():
    """Check if MongoDB is running as a replica set"""
    try:
        status = mongo.admin.command('replSetGetStatus')
        logger.info("✅ MongoDB replica set detected")
        return True
    except Exception as e:
        logger.warning(f"⚠️ MongoDB replica set not available: {e}")
        logger.warning("⚠️ Change streams require a replica set configuration")
        logger.warning("💡 Real-time sync disabled. Run backfill.py to index existing data.")
        return False

def start_sync():
    """Start real-time sync using MongoDB change streams"""
    if not check_replica_set():
        logger.info("📊 Falling back to manual sync mode")
        return  # Exit gracefully without crashing
    
    logger.info("🔄 Starting real-time sync: complaint_db.complaints → Qdrant")
    resume_token = None
    
    while True:
        try:
            with docs.watch(resume_after=resume_token) as stream:
                logger.info("👁️ Watching for MongoDB changes...")
                for change in stream:
                    resume_token = stream.resume_token
                    threading.Thread(target=handle_change, args=(change,), daemon=True).start()
        except Exception as e:
            logger.error(f"❌ Change stream error: {e}")
            logger.info("🔄 Reconnecting in 5s...")
            time.sleep(5)

def run_background_sync():
    """Start the background sync thread with error handling"""
    def safe_start():
        try:
            start_sync()
        except Exception as e:
            logger.error(f"❌ Sync thread failed: {e}")
            logger.warning("⚠️ Real-time sync is not running")
            logger.info("💡 You can still use the service, but run backfill.py to sync data")
    
    thread = threading.Thread(target=safe_start, daemon=True)
    thread.start()
    logger.info("🚀 Background sync thread started")