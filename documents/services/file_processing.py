import os
import fitz  # PyMuPDF
from docx import Document


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