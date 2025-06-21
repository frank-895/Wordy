#!/usr/bin/env python3
"""
Test script for font styling in PDF generation.
"""

import json
import os
from services.pdf_generator import build_pdf
from services.lexical_processor import parse_lexical_json

def test_font_styling():
    """Test PDF generation with font styling."""
    
    # Sample Lexical JSON with font styling
    sample_lexical = {
        "root": {
            "children": [
                {
                    "children": [
                        {
                            "detail": 0,
                            "format": 0,
                            "mode": "normal",
                            "style": "font-family: 'Times New Roman'; font-size: 24px; color: #ff0000;",
                            "text": "Red Times New Roman Heading",
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
                            "style": "font-family: 'Arial'; font-size: 16px; color: #0000ff;",
                            "text": "Bold blue Arial text ",
                            "type": "text",
                            "version": 1
                        },
                        {
                            "detail": 0,
                            "format": 2,  # Italic
                            "mode": "normal",
                            "style": "font-family: 'Georgia'; font-size: 14px; color: #008000;",
                            "text": "italic green Georgia text",
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
                            "style": "font-family: 'Courier New'; font-size: 12px; color: #800080;",
                            "text": "Purple Courier New text with {{name}} placeholder",
                            "type": "text",
                            "version": 1
                        }
                    ],
                    "direction": "ltr",
                    "format": "",
                    "indent": 0,
                    "type": "paragraph",
                    "version": 1
                }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "root",
            "version": 1
        }
    }
    
    print("Testing font styling in PDF generation...")
    
    try:
        # Parse Lexical JSON
        blocks = parse_lexical_json(sample_lexical)
        print(f"Parsed {len(blocks)} blocks")
        
        # Print the parsed blocks to see the formatting
        for i, block in enumerate(blocks):
            print(f"Block {i}: {block[0]} - {block[1]}")
            if isinstance(block[1], list):
                for j, segment in enumerate(block[1]):
                    print(f"  Segment {j}: '{segment['text']}' - {segment['format']}")
        
        # Generate PDF
        pdf_buffer = build_pdf(blocks)
        
        # Save PDF to file
        output_path = "test_font_styling.pdf"
        with open(output_path, "wb") as f:
            f.write(pdf_buffer.getvalue())
        
        print(f"✅ PDF with font styling generated successfully: {output_path}")
        print(f"File size: {os.path.getsize(output_path)} bytes")
        
        return True
        
    except Exception as e:
        print(f"❌ Font styling test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_font_styling()
    exit(0 if success else 1) 