#!/usr/bin/env python3
"""
Test script to verify placeholder extraction works correctly.
"""

import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from template_engine.services.lexical_processor import parse_lexical_json

def test_placeholder_extraction():
    """Test placeholder extraction from different text formats."""
    
    # Test case 1: Plain text with placeholders
    plain_text_json = {
        "root": {
            "children": [
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": "Hello {{name}}, welcome to {{company}}!",
                            "format": 0
                        }
                    ]
                }
            ]
        }
    }
    
    # Test case 2: Formatted text with placeholders
    formatted_text_json = {
        "root": {
            "children": [
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": "Hello ",
                            "format": 0
                        },
                        {
                            "type": "text",
                            "text": "{{name}}",
                            "format": 1  # Bold
                        },
                        {
                            "type": "text",
                            "text": ", welcome to ",
                            "format": 0
                        },
                        {
                            "type": "text",
                            "text": "{{company}}",
                            "format": 2  # Italic
                        },
                        {
                            "type": "text",
                            "text": "!",
                            "format": 0
                        }
                    ]
                }
            ]
        }
    }
    
    # Test case 3: Mixed content with prompts
    mixed_content_json = {
        "root": {
            "children": [
                {
                    "type": "heading",
                    "level": 1,
                    "children": [
                        {
                            "type": "text",
                            "text": "Report for {{client_name}}",
                            "format": 1
                        }
                    ]
                },
                {
                    "type": "paragraph",
                    "children": [
                        {
                            "type": "text",
                            "text": "Summary: ",
                            "format": 0
                        },
                        {
                            "type": "text",
                            "text": "[[summary_prompt]]",
                            "format": 0
                        }
                    ]
                }
            ]
        }
    }
    
    def extract_placeholders_from_blocks(blocks):
        """Extract placeholders and prompts from parsed blocks."""
        import re
        placeholder_pattern = r"\{\{(.*?)\}\}"
        prompt_pattern = r"\[\[(.*?)\]\]"
        
        placeholders = set()
        prompts = set()
        
        def extract_from_text(text):
            placeholders.update(re.findall(placeholder_pattern, text))
            prompts.update(re.findall(prompt_pattern, text))
        
        for block in blocks:
            content = block[1]
            
            if isinstance(content, str):
                extract_from_text(content)
            elif isinstance(content, list):
                for segment in content:
                    if isinstance(segment, dict) and 'text' in segment:
                        extract_from_text(segment['text'])
                    elif isinstance(segment, str):
                        extract_from_text(segment)
            elif isinstance(content, list) and all(isinstance(item, str) for item in content):
                for item in content:
                    extract_from_text(item)
        
        return sorted(placeholders), sorted(prompts)
    
    # Test all cases
    test_cases = [
        ("Plain text", plain_text_json),
        ("Formatted text", formatted_text_json),
        ("Mixed content", mixed_content_json)
    ]
    
    print("Testing placeholder extraction...")
    print("=" * 50)
    
    for test_name, json_data in test_cases:
        print(f"\nTest: {test_name}")
        blocks = parse_lexical_json(json_data)
        placeholders, prompts = extract_placeholders_from_blocks(blocks)
        
        print(f"  Blocks parsed: {len(blocks)}")
        print(f"  Placeholders found: {placeholders}")
        print(f"  Prompts found: {prompts}")
        
        # Verify expected results
        if test_name == "Plain text":
            expected_placeholders = ['name', 'company']
            assert set(placeholders) == set(expected_placeholders), f"Expected {expected_placeholders}, got {placeholders}"
            print("  ✓ Plain text test passed")
            
        elif test_name == "Formatted text":
            expected_placeholders = ['name', 'company']
            assert set(placeholders) == set(expected_placeholders), f"Expected {expected_placeholders}, got {placeholders}"
            print("  ✓ Formatted text test passed")
            
        elif test_name == "Mixed content":
            expected_placeholders = ['client_name']
            expected_prompts = ['summary_prompt']
            assert set(placeholders) == set(expected_placeholders), f"Expected {expected_placeholders}, got {placeholders}"
            assert set(prompts) == set(expected_prompts), f"Expected {expected_prompts}, got {prompts}"
            print("  ✓ Mixed content test passed")
    
    print("\n" + "=" * 50)
    print("✓ All placeholder extraction tests passed!")

if __name__ == "__main__":
    test_placeholder_extraction() 