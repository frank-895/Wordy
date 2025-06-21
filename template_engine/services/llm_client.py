import os
import logging
from openai import OpenAI
from opik.integrations.openai import track_openai
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Set Opik tracking credentials
os.environ["OPIK_API_KEY"] = os.getenv("OPIK_API_KEY", "")
os.environ["OPIK_WORKSPACE"] = os.getenv("OPIK_WORKSPACE", "")

# Wrap client
openai_client = track_openai(OpenAI())

def call_llm(prompt, context_info=None):
    """
    Call the OpenAI LLM and return the response text.
    
    Args:
        prompt: The primary prompt to send to the LLM
        context_info: Optional list of relevant document chunks for context
    """
    # Start with the primary prompt
    full_prompt = prompt
    
    # Add context as secondary information if provided
    if context_info and len(context_info) > 0:
        logger.info(f"🔍 RAG DEBUG: Using {len(context_info)} context chunks for LLM call")
        logger.info(f"🔍 RAG DEBUG: Primary prompt: {prompt[:100]}...")
        
        full_prompt += "\n\n--- CONTEXT (Reference if needed) ---\n"
        for i, chunk in enumerate(context_info, 1):
            # Handle different metadata structures
            document_name = chunk.get('document_name') or chunk.get('metadata', {}).get('document_name') or chunk.get('metadata', {}).get('source', 'Unknown Document')
            similarity_score = chunk.get('similarity_score', 1.0)  # Default to 1.0 if not provided
            content = chunk.get('content', '')
            
            # Log chunk details
            logger.info(f"🔍 RAG DEBUG: Context {i}: Document='{document_name}', Similarity={similarity_score:.3f}, Content length={len(content)} chars")
            logger.info(f"🔍 RAG DEBUG: Context {i} content preview: {content[:100]}...")
            
            full_prompt += f"\nContext {i} (from {document_name}, relevance: {similarity_score:.3f}):\n{content}\n"
        full_prompt += "\n--- END CONTEXT ---\n\n"
        full_prompt += "Please use the primary prompt information first, and reference the context above if it's relevant to your response."
        
        logger.info(f"🔍 RAG DEBUG: Full prompt length: {len(full_prompt)} characters")
    else:
        logger.info("🔍 RAG DEBUG: No context provided for LLM call")
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": full_prompt}],
        )
        content = response.choices[0].message.content
        logger.info(f"🔍 RAG DEBUG: LLM response length: {len(content) if content else 0} characters")
        return content.strip() if content else ""
    except Exception as e:
        logger.error(f"🔍 RAG DEBUG: Error calling LLM: {str(e)}")
        raise
