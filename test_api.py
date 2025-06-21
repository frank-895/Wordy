#!/usr/bin/env python3
"""
Test script for the API endpoint with PDF generation.
"""

import requests
import json

def test_api():
    """Test the API endpoint for PDF generation."""
    
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
    
    # Test data
    test_data = {
        "lexical_json": sample_lexical,
        "template_id": "a022963e-a102-4b7e-8baa-f2d5e21ded80",
        "context_map": {
            "name": "John Doe"
        },
        "prompt_map": {
            "greeting": "Hello, how are you today?"
        }
    }
    
    print("Testing API endpoint...")
    
    try:
        # Test the generate document endpoint
        response = requests.post(
            "http://localhost:8000/api/template/generate_doc/",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        
        if response.status_code == 200:
            # Save the PDF
            with open("api_test_output.pdf", "wb") as f:
                f.write(response.content)
            print("✅ PDF generated successfully via API")
            print("File saved as: api_test_output.pdf")
        else:
            print(f"❌ API request failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django is running on port 8000.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_api() 