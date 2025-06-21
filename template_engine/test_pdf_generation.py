#!/usr/bin/env python3
"""
Test script for PDF generation using WeasyPrint.
"""

import json
import os
from services.pdf_generator import build_pdf
from services.lexical_processor import parse_lexical_json

def test_pdf_generation():
    """Test PDF generation with sample Lexical JSON."""
    
    # Sample Lexical JSON with various formatting
    sample_lexical = {
        "root": {
            "children": [
                {
                    "children": [
                        {
                            "detail": 0,
                            "format": 0,
                            "mode": "normal",
                            "style": "",
                            "text": "Sample Document Title",
                            "type": "text",
                            "version": 1
                        }
                    ],
                    "direction": "ltr",
                    "format": "",
                    "indent": 0,
                    "type": "heading",
                    "version": 1,
                    "tag": "h1"
                },
                {
                    "children": [
                        {
                            "detail": 0,
                            "format": 1,  # Bold
                            "mode": "normal",
                            "style": "",
                            "text": "This is bold text with ",
                            "type": "text",
                            "version": 1
                        },
                        {
                            "detail": 0,
                            "format": 2,  # Italic
                            "mode": "normal",
                            "style": "",
                            "text": "italic text",
                            "type": "text",
                            "version": 1
                        },
                        {
                            "detail": 0,
                            "format": 0,
                            "mode": "normal",
                            "style": "",
                            "text": " and normal text.",
                            "type": "text",
                            "version": 1
                        }
                    ],
                    "direction": "ltr",
                    "format": "",
                    "indent": 0,
                    "type": "paragraph",
                    "version": 1
                },
                {
                    "children": [
                        {
                            "detail": 0,
                            "format": 0,
                            "mode": "normal",
                            "style": "",
                            "text": "This is a paragraph with {{placeholder}} and [[prompt_key]].",
                            "type": "text",
                            "version": 1
                        }
                    ],
                    "direction": "ltr",
                    "format": "",
                    "indent": 0,
                    "type": "paragraph",
                    "version": 1
                },
                {
                    "children": [
                        {
                            "detail": 0,
                            "format": 0,
                            "mode": "normal",
                            "style": "",
                            "text": "print('Hello, World!')",
                            "type": "text",
                            "version": 1
                        }
                    ],
                    "direction": "ltr",
                    "format": "",
                    "indent": 0,
                    "type": "code",
                    "version": 1,
                    "language": "python"
                }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "root",
            "version": 1
        }
    }
    
    print("Testing PDF generation...")
    
    try:
        # Parse Lexical JSON
        blocks = parse_lexical_json(sample_lexical)
        print(f"Parsed {len(blocks)} blocks")
        
        # Generate PDF
        pdf_buffer = build_pdf(blocks)
        
        # Save PDF to file
        output_path = "test_output.pdf"
        with open(output_path, "wb") as f:
            f.write(pdf_buffer.getvalue())
        
        print(f"✅ PDF generated successfully: {output_path}")
        print(f"File size: {os.path.getsize(output_path)} bytes")
        
        return True
        
    except Exception as e:
        print(f"❌ PDF generation failed: {e}")
        return False

if __name__ == "__main__":
    success = test_pdf_generation()
    exit(0 if success else 1) 