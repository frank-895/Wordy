import json
from django.conf import settings
from openai import OpenAI

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def llm_chat_json(prompt, system_instruction, model="gpt-4o-mini", temperature=0.2, max_tokens=200):
    """
    Sends a prompt to the LLM with a system instruction and expects a JSON response.
    Returns the parsed JSON or an error dict if parsing fails.
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        raw_output = response.choices[0].message.content.strip()
        try:
            parsed = json.loads(raw_output)
            return {"success": True, "data": parsed}
        except json.JSONDecodeError:
            return {"success": False, "error": "Model returned non-JSON output", "raw": raw_output}
    except Exception as e:
        return {"success": False, "error": str(e)} 