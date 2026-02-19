"""
RAG Service - Handles document processing, embedding, and querying.
Uses ChromaDB as the vector store and sentence-transformers for embeddings.
"""
import os
import logging
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

# ChromaDB setup
CHROMA_PERSIST_DIR = os.path.join(settings.BASE_DIR, 'chroma_db')

def get_chroma_client():
    """Get or create a persistent ChromaDB client."""
    import chromadb
    return chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)


def get_collection_name(user_id):
    """Generate a unique collection name per user."""
    return f"user_{user_id}_docs"


def extract_text(file_path, file_type):
    """Extract text content from a file based on its type."""
    text = ""
    try:
        if file_type == 'pdf':
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        elif file_type in ('txt', 'md', 'csv'):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
        raise
    return text


def chunk_text(text, chunk_size=500, chunk_overlap=50):
    """Split text into overlapping chunks for embedding."""
    chunks = []
    if not text:
        return chunks
    
    words = text.split()
    current_chunk = []
    current_size = 0

    for word in words:
        current_chunk.append(word)
        current_size += 1
        if current_size >= chunk_size:
            chunks.append(' '.join(current_chunk))
            # Keep overlap
            current_chunk = current_chunk[-chunk_overlap:]
            current_size = len(current_chunk)

    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks


def process_document(document):
    """
    Full pipeline: extract text -> chunk -> embed -> store in ChromaDB.
    Updates the Document model status accordingly.
    """
    try:
        document.status = 'processing'
        document.save(update_fields=['status'])

        # 1. Extract text
        file_path = document.file.path
        text = extract_text(file_path, document.file_type)

        if not text.strip():
            document.status = 'failed'
            document.error_message = 'No text content could be extracted from the file.'
            document.save(update_fields=['status', 'error_message'])
            return False

        # 2. Chunk text
        chunks = chunk_text(text)

        if not chunks:
            document.status = 'failed'
            document.error_message = 'Failed to create text chunks.'
            document.save(update_fields=['status', 'error_message'])
            return False

        # 3. Store in ChromaDB
        client = get_chroma_client()
        collection = client.get_or_create_collection(
            name=get_collection_name(document.user.id),
            metadata={"hnsw:space": "cosine"}
        )

        # Create unique IDs and metadata for each chunk
        ids = [f"doc_{document.id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": str(document.id),
                "document_title": document.title,
                "chunk_index": i,
            }
            for i in range(len(chunks))
        ]

        # Add to ChromaDB (it handles embedding internally with its default model)
        collection.add(
            documents=chunks,
            ids=ids,
            metadatas=metadatas,
        )

        # 4. Update document status
        document.status = 'ready'
        document.chunk_count = len(chunks)
        document.error_message = ''
        document.save(update_fields=['status', 'chunk_count', 'error_message'])

        logger.info(f"Document {document.id} processed: {len(chunks)} chunks indexed.")
        return True

    except Exception as e:
        logger.error(f"Error processing document {document.id}: {e}")
        document.status = 'failed'
        document.error_message = str(e)
        document.save(update_fields=['status', 'error_message'])
        return False


def query_knowledge_base(user_id, query_text, n_results=3, document_ids=None):
    """
    Search the user's vector store for relevant context.
    Returns a list of relevant text chunks.
    """
    try:
        client = get_chroma_client()
        collection_name = get_collection_name(user_id)

        try:
            collection = client.get_collection(name=collection_name)
        except Exception:
            return []

        # Build where filter if specific documents are requested
        where_filter = None
        if document_ids:
            if len(document_ids) == 1:
                where_filter = {"document_id": str(document_ids[0])}
            else:
                where_filter = {"document_id": {"$in": [str(d) for d in document_ids]}}

        results = collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where_filter,
        )

        if results and results['documents'] and results['documents'][0]:
            return results['documents'][0]

        return []

    except Exception as e:
        logger.error(f"Error querying knowledge base for user {user_id}: {e}")
        return []


def delete_document_from_index(document):
    """Remove a document's chunks from the vector store."""
    try:
        client = get_chroma_client()
        collection_name = get_collection_name(document.user.id)
        
        try:
            collection = client.get_collection(name=collection_name)
        except Exception:
            return

        # Delete all chunks for this document
        collection.delete(
            where={"document_id": str(document.id)}
        )
        logger.info(f"Deleted chunks for document {document.id} from index.")

    except Exception as e:
        logger.error(f"Error deleting document {document.id} from index: {e}")
