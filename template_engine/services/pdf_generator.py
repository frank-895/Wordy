"""
PDF generator using WeasyPrint to convert HTML to PDF.
This replaces the DOCX generator with a more flexible HTML-based approach.
"""

import io
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
from .html_generator import build_html
from typing import Optional

def build_pdf(blocks):
    """
    Builds a PDF file from structured blocks with formatting support.
    
    Args:
        blocks: List of tuples (block_type, content[, metadata])
        
    Returns:
        BytesIO buffer containing the generated PDF
    """
    # Generate HTML from blocks
    html_content = build_html(blocks)
    
    # Create PDF from HTML
    pdf_buffer = generate_pdf_from_html(html_content)
    
    return pdf_buffer

def generate_pdf_from_html(html_content: str) -> io.BytesIO:
    """
    Generate PDF from HTML content using WeasyPrint.
    
    Args:
        html_content: Complete HTML document as string
        
    Returns:
        BytesIO buffer containing the PDF
    """
    # Configure fonts
    font_config = FontConfiguration()
    
    # Create HTML object
    html_doc = HTML(string=html_content)
    
    # Generate PDF
    pdf_bytes = html_doc.write_pdf(
        font_config=font_config,
        optimize_images=True
    )
    
    # Handle potential None return
    if pdf_bytes is None:
        raise RuntimeError("Failed to generate PDF from HTML")
    
    # Return as BytesIO buffer
    buffer = io.BytesIO(pdf_bytes)
    buffer.seek(0)
    return buffer

def generate_pdf_with_custom_css(html_content: str, custom_css: Optional[str] = None) -> io.BytesIO:
    """
    Generate PDF with custom CSS styles.
    
    Args:
        html_content: Complete HTML document as string
        custom_css: Optional custom CSS string
        
    Returns:
        BytesIO buffer containing the PDF
    """
    # Configure fonts
    font_config = FontConfiguration()
    
    # Create HTML object
    html_doc = HTML(string=html_content)
    
    # Add custom CSS if provided
    stylesheets = []
    if custom_css is not None:
        stylesheets.append(CSS(string=custom_css))
    
    # Generate PDF
    pdf_bytes = html_doc.write_pdf(
        font_config=font_config,
        stylesheets=stylesheets,
        optimize_images=True
    )
    
    # Handle potential None return
    if pdf_bytes is None:
        raise RuntimeError("Failed to generate PDF from HTML")
    
    # Return as BytesIO buffer
    buffer = io.BytesIO(pdf_bytes)
    buffer.seek(0)
    return buffer 