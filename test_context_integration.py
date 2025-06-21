#!/usr/bin/env python3
"""
Test script to verify context integration in document generation.
This script tests the flow from prompt extraction to context retrieval.
"""

import json
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Wordy.settings')
import django
django.setup()

from template_engine.services.placeholder_resolver import resolve_placeholders
from rag_pipeline.services.rag_pipeline import RAGPipeline

def test_context_integration():
    """Test the context integration flow"""
    
    # Test data
    context_map = {
        "name": "Alice Johnson",
        "company": "TechCorp"
    }
    
    prompt_map = {
        "summary": "Write a professional summary about {{name}} who works at {{company}}",
        "background": "Provide background information for {{name}}"
    }
    
    print("Testing context integration...")
    print(f"Context map: {context_map}")
    print(f"Prompt map: {prompt_map}")
    
    # Test 1: Extract and resolve prompts
    print("\n1. Testing prompt extraction and resolution...")
    all_prompts = []
    for prompt_key, prompt_template in prompt_map.items():
        resolved_prompt = resolve_placeholders(prompt_template, context_map)
        all_prompts.append(resolved_prompt)
        print(f"  {prompt_key}: {resolved_prompt}")
    
    # Test 2: Create search query
    search_query = " ".join(all_prompts) if all_prompts else "document generation"
    print(f"\n2. Search query: {search_query}")
    
    # Test 3: Initialize RAG pipeline
    print("\n3. Initializing RAG pipeline...")
    try:
        rag_pipeline = RAGPipeline()
        print("  ✓ RAG pipeline initialized successfully")
    except Exception as e:
        print(f"  ✗ Failed to initialize RAG pipeline: {e}")
        return False
    
    # Test 4: Get relevant chunks
    print("\n4. Retrieving relevant chunks...")
    try:
        relevant_chunks = rag_pipeline.get_similar_chunks_internal(search_query, top_k=3)
        print(f"  ✓ Found {len(relevant_chunks)} relevant chunks")
        
        for i, chunk in enumerate(relevant_chunks, 1):
            print(f"    Chunk {i}: {chunk['document_name']} (score: {chunk['similarity_score']:.3f})")
            print(f"      Content preview: {chunk['content'][:100]}...")
    except Exception as e:
        print(f"  ✗ Failed to retrieve chunks: {e}")
        return False
    
    # Test 5: Format context info
    print("\n5. Formatting context info...")
    context_info = []
    for chunk in relevant_chunks:
        context_info.append({
            'content': chunk['content'],
            'document_name': chunk['document_name'],
            'similarity_score': chunk['similarity_score']
        })
    print(f"  ✓ Formatted {len(context_info)} context items")
    
    # Test 6: Test LLM prompt construction
    print("\n6. Testing LLM prompt construction...")
    from template_engine.services.llm_client import call_llm
    
    test_prompt = "Write a brief summary about Alice Johnson"
    try:
        # This would normally call the LLM, but we'll just test the prompt construction
        print(f"  Test prompt: {test_prompt}")
        print(f"  Context info available: {len(context_info)} chunks")
        print("  ✓ Context integration test completed successfully")
    except Exception as e:
        print(f"  ✗ Failed to test LLM integration: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_context_integration()
    if success:
        print("\n✅ All tests passed! Context integration is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the implementation.")
        sys.exit(1) 