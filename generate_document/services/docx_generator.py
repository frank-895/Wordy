from docx import Document
import io

def build_docx(blocks):
    """Builds a DOCX file from structured blocks"""
    doc = Document()
    for block in blocks:
        if block[0] == 'heading':
            doc.add_heading(block[1], level=block[2])
        elif block[0] == 'paragraph':
            doc.add_paragraph(block[1])

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
