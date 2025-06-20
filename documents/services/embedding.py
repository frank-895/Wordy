import nltk
import numpy as np
from openai import OpenAI

from django.conf import settings
from ..models import DocumentContext, DocumentChunk


client = OpenAI(api_key=settings.OPENAI_API_KEY)


def split_text_into_chunks(text, max_chars=1000):
    """
    Splits text into chunks that respect sentence boundaries using NLTK.
    """
    sentences = nltk.sent_tokenize(text)
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 <= max_chars:
            current_chunk += " " + sentence
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


def embed_text(text):
    """
    Generate an embedding using OpenAI's new API client.
    """
    response = client.embeddings.create(
        input=[text],  # needs to be a list
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding


def create_chunks_and_embeddings(document: DocumentContext):
    """
    Given a Document instance, split and embed its text.
    """
    text = document.extracted_text
    chunks = split_text_into_chunks(text)

    for chunk_text in chunks:
        embedding = embed_text(chunk_text)
        DocumentChunk.objects.create(
            session_id=document.session_id,
            document=document,
            content=chunk_text,
            embedding=embedding
        )


def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def get_relevant_chunks(prompt: str, session_id: str, top_k: int = 3):
    """
    Retrieve the top K most relevant document chunks for a given prompt and session.
    """
    # Step 1: Embed the prompt
    response = client.embeddings.create(
        input=[prompt],
        model="text-embedding-ada-002"
    )
    prompt_embedding = response.data[0].embedding

    # Step 2: Load chunks for this session
    chunks = DocumentChunk.objects.filter(session_id=session_id)

    # Step 3: Compute similarity
    scored_chunks = []
    for chunk in chunks:
        sim = cosine_similarity(prompt_embedding, chunk.embedding)
        scored_chunks.append((sim, chunk))

    # Step 4: Sort and return top_k
    scored_chunks.sort(reverse=True, key=lambda x: x[0])
    return [chunk.content for _, chunk in scored_chunks[:top_k]]
