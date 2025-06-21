import re
from .llm_client import call_llm

def resolve_placeholders(text, context, start="{{", end="}}"):
    """
    Replace context placeholders like {{placeholder}} in text using context_map.
    """
    pattern = re.escape(start) + r"(.*?)" + re.escape(end)
    return re.sub(pattern, lambda m: context.get(m.group(1).strip(), m.group(0)), text)

def resolve_llm_prompts(text, context, prompts, start="[[", end="]]", placeholder_delims=("{{", "}}")):
    """
    Replace [[prompt_key]] with LLM-generated content.
    Looks up prompt_key in prompts, fills it with {{context}}, then calls LLM.
    """
    pattern = re.escape(start) + r"(.*?)" + re.escape(end)

    def llm_replace(match):
        prompt_key = match.group(1).strip()
        prompt_template = prompts.get(prompt_key)
        if not prompt_template:
            return f"[Missing prompt for key: {prompt_key}]"
        filled_prompt = resolve_placeholders(prompt_template, context, *placeholder_delims)
        return call_llm(filled_prompt)

    return re.sub(pattern, llm_replace, text, flags=re.DOTALL)
