#!/usr/bin/env python3
"""
Script to create a test template with font styling in the database.
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Wordy.settings')
django.setup()

from template_engine.models import Template

def create_styled_template():
    """Create a test template with font styling in the database."""
    
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
                            "text": "Styled Document Title",
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
                            "text": "Hello {{name}}, this is ",
                            "type": "text",
                            "version": 1
                        },
                        {
                            "detail": 0,
                            "format": 2,  # Italic
                            "mode": "normal",
                            "style": "font-family: 'Georgia'; font-size: 14px; color: #008000;",
                            "text": "styled text",
                            "type": "text",
                            "version": 1
                        },
                        {
                            "detail": 0,
                            "format": 0,
                            "mode": "normal",
                            "style": "font-family: 'Arial'; font-size: 16px; color: #000000;",
                            "text": " with [[greeting]].",
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
    
    try:
        # Create the template
        template = Template.objects.create(
            name="Styled Template",
            lexical_json=sample_lexical
        )
        
        print(f"✅ Styled template created successfully!")
        print(f"Template ID: {template.id}")
        print(f"Template Name: {template.name}")
        
        return template.id
        
    except Exception as e:
        print(f"❌ Failed to create styled template: {e}")
        return None

if __name__ == "__main__":
    template_id = create_styled_template()
    if template_id:
        print(f"\nUse this template_id in your API tests: {template_id}") 