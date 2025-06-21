#!/usr/bin/env python3
"""
Test script for the API with styled template.
"""

import requests
import json

def test_styled_api():
    """Test the API with a styled template."""
    
    # Test data with the styled template
    test_data = {
        "template_id": "bf8a2cb3-abf7-4a55-be92-8373fa111211",
        "context_map": {
            "name": "John Doe"
        },
        "prompt_map": {
            "greeting": "Welcome to our styled document!"
        }
    }
    
    print("Testing API with styled template...")
    
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
            with open("styled_api_test_output.pdf", "wb") as f:
                f.write(response.content)
            print("✅ Styled PDF generated successfully via API")
            print("File saved as: styled_api_test_output.pdf")
            print("This PDF should contain:")
            print("- Red Times New Roman heading")
            print("- Blue bold Arial text")
            print("- Green italic Georgia text")
            print("- Placeholder 'John Doe' and prompt 'Welcome to our styled document!'")
        else:
            print(f"❌ API request failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure Django is running on port 8000.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_styled_api() 