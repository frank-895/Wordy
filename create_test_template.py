#!/usr/bin/env python3
"""
Script to create a test template in the database.
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

def create_test_template():
    """Create a test template in the database."""
    
    # Sample Lexical JSON
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
                            "text": "Test Document",
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
                            "format": 0,
                            "mode": "normal",
                            "style": "",
                            "text": "This is a test document with {{name}} and [[greeting]].",
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
            name="Test Template",
            lexical_json=sample_lexical
        )
        
        print(f"✅ Test template created successfully!")
        print(f"Template ID: {template.id}")
        print(f"Template Name: {template.name}")
        
        return template.id
        
    except Exception as e:
        print(f"❌ Failed to create template: {e}")
        return None

if __name__ == "__main__":
    template_id = create_test_template()
    if template_id:
        print(f"\nUse this template_id in your API tests: {template_id}") 