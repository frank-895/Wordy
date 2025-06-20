import os
import fitz  # PyMuPDF
from docx import Document

import textwrap
from openai import OpenAI
from django.conf import settings
from .models import DocumentChunk

def extract_text_from_file(file_field):
    path = file_field.path
    _, ext = os.path.splitext(path.lower())

    if ext == ".docx":
        return extract_docx(path)
    elif ext == ".pdf":
        return extract_pdf(path)
    elif ext == ".txt":
        return extract_txt(path)
    else:
        return ""  # unsupported

def extract_docx(path):
    doc = Document(path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_pdf(path):
    text = ""
    with fitz.open(path) as doc:
        for page in doc:
            text += page.get_text()
    return text

def extract_txt(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def split_text_into_chunks(text, max_chars=1000):
    """
    Simple word-based chunking. You can improve this later with NLP-aware splitting.
    """
    return textwrap.wrap(text, width=max_chars, break_long_words=False)

def embed_text(text):
    """
    Generate an embedding using OpenAI's new API client.
    """
    response = client.embeddings.create(
        input=[text],  # needs to be a list
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

def create_chunks_and_embeddings(document):
    """
    Given a DocumentContext instance, split and embed its text.
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
