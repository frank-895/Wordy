import json
from django.conf import settings
from openai import OpenAI
from pathlib import Path

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def get_main_prompt():
    prompt_path = Path(__file__).parent / "prompts" / "main_prompt.md"
    with open(prompt_path, "r") as f:
        return f.read()

def format_context_prompt(prompt: str, context_chunks: list[str]) -> tuple[str, str]:
    """
    Returns a tuple of (system_message, user_message) for the chat API.
    """
    context_text = "\n\n".join(context_chunks)
    system = get_main_prompt()
    user = f"""Context:
{context_text}

User Prompt:
{prompt}
"""
    return system, user

client = OpenAI(api_key=settings.OPENAI_AI_KEY) if getattr(settings, "OPENAI_AI_KEY", None) else None

def llm_chat_json(prompt, system):
    if not client:
        return {"success": False, "error": "OpenAI client not initialized"}
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=300
        )
        content = response.choices[0].message.content
        if content is None:
            return {"success": False, "error": "No content in response"}
        return {"success": True, "data": json.loads(content.strip())}
    except json.JSONDecodeError:
        return {"success": False, "error": "Non-JSON output", "raw": content}
    except Exception as e:
        return {"success": False, "error": str(e)}