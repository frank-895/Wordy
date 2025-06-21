import os
from openai import OpenAI
from opik.integrations.openai import track_openai
from dotenv import load_dotenv

# Load .env
load_dotenv()

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
        full_prompt += "\n\n--- CONTEXT (Reference if needed) ---\n"
        for i, chunk in enumerate(context_info, 1):
            full_prompt += f"\nContext {i} (from {chunk['document_name']}, relevance: {chunk['similarity_score']:.3f}):\n{chunk['content']}\n"
        full_prompt += "\n--- END CONTEXT ---\n\n"
        full_prompt += "Please use the primary prompt information first, and reference the context above if it's relevant to your response."
    
    response = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": full_prompt}],
    )
    return response.choices[0].message.content.strip()
