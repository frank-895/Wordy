#!/usr/bin/env python3
"""
Test script for the template fields extraction API endpoint.
"""

import requests
import json

def test_fields_api():
    """Test the template fields extraction API endpoint."""
    
    # Sample Lexical JSON with placeholders and prompts
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
                            "text": "Document with {{name}} and {{email}}",
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
                            "text": "This document contains [[greeting]] and [[summary]] prompts.",
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
    
    # Test data
    test_data = {
        "lexical_json": sample_lexical
    }
    
    print("Testing template fields extraction API...")
    
    try:
        # Test the extract template fields endpoint
        response = requests.post(
            "http://localhost:8000/api/template/extract_fields/",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Template fields extracted successfully")
            print(f"Placeholders: {data.get('template_fields', {}).get('placeholders', [])}")
            print(f"Prompts: {data.get('template_fields', {}).get('prompts', [])}")
        else:
            print(f"❌ API request failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django is running on port 8000.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_fields_api() 