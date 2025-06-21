import os
from openai import OpenAI
from opik.integrations.openai import track_openai
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Load Opik keys from environment
os.environ["OPIK_API_KEY"] = os.getenv("OPIK_API_KEY", "")
os.environ["OPIK_WORKSPACE"] = os.getenv("OPIK_WORKSPACE", "")

# Wrap the OpenAI client with Opik tracking
openai_client = track_openai(OpenAI())

def call_llm(prompt):
    """Call the OpenAI LLM and return the generated text."""
    response = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()
