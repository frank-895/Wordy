import re
from .llm_client import call_llm
from .lexical_processor import parse_lexical_json

def resolve_placeholders(text, context, start="{{", end="}}"):
    """
    Replace context placeholders like {{placeholder}} in text using context_map.
    """
    pattern = re.escape(start) + r"(.*?)" + re.escape(end)
    return re.sub(pattern, lambda m: context.get(m.group(1).strip(), m.group(0)), text)

def resolve_llm_prompts(text, context, prompts, context_info=None, start="[[", end="]]", placeholder_delims=("{{", "}}")):
    """
    Replace [[prompt_key]] with LLM-generated content.
    Looks up prompt_key in prompts, fills it with {{context}}, then calls LLM.
    
    Args:
        text: Text containing prompt placeholders
        context: Dictionary of context values
        prompts: Dictionary of prompt templates
        context_info: Optional list of relevant document chunks for context
        start: Start delimiter for prompts (default: "[[")
        end: End delimiter for prompts (default: "]]")
        placeholder_delims: Tuple of placeholder delimiters (default: ("{{", "}}"))
    """
    pattern = re.escape(start) + r"(.*?)" + re.escape(end)

    def llm_replace(match):
        prompt_key = match.group(1).strip()
        prompt_template = prompts.get(prompt_key)
        if not prompt_template:
            return f"[Missing prompt for key: {prompt_key}]"
        filled_prompt = resolve_placeholders(prompt_template, context, *placeholder_delims)
        return call_llm(filled_prompt, context_info)

    return re.sub(pattern, llm_replace, text, flags=re.DOTALL)

def extract_template_fields(lexical_json):
    """
    Extract all placeholders and prompt keys from Lexical JSON content.
    
    Args:
        lexical_json: The Lexical JSON content
        
    Returns:
        Dictionary with 'placeholders' and 'prompts' lists
    """
    blocks = parse_lexical_json(lexical_json)
    placeholder_pattern = r"\{\{(.*?)\}\}"
    prompt_pattern = r"\[\[(.*?)\]\]"

    placeholders = set()
    prompts = set()

    def extract_placeholders_from_text(text):
        """Extract placeholders and prompts from text."""
        placeholders.update(re.findall(placeholder_pattern, text))
        prompts.update(re.findall(prompt_pattern, text))

    for block in blocks:
        block_type = block[0]
        content = block[1]

        if isinstance(content, str):
            # Handle plain text content
            extract_placeholders_from_text(content)
        elif isinstance(content, list):
            # Handle formatted text segments
            for segment in content:
                if isinstance(segment, dict) and 'text' in segment:
                    # Extract from formatted text segment
                    extract_placeholders_from_text(segment['text'])
                elif isinstance(segment, str):
                    # Extract from plain text segment
                    extract_placeholders_from_text(segment)
        elif isinstance(content, list) and all(isinstance(item, str) for item in content):
            # Handle list items (plain text)
            for item in content:
                extract_placeholders_from_text(item)

    return {
        'placeholders': sorted(list(placeholders)),
        'prompts': sorted(list(prompts)),
    }
