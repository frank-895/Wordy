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

def resolve_variables_in_text(text, variables, context_map, prompt_map, context_info=None):
    """
    Resolve variable references in text using the new variable system.
    
    Args:
        text: Text that may contain variable references
        variables: List of variable definitions from the frontend
        context_map: Dictionary of context values for {{placeholders}}
        prompt_map: Dictionary of prompt templates for [[prompts]]
        context_info: Optional list of relevant document chunks for context
        
    Returns:
        Text with variables resolved
    """
    # Create a mapping from variable ID to variable definition
    variable_map = {var['id']: var for var in variables}
    
    # First resolve any {{placeholders}} in the text
    text = resolve_placeholders(text, context_map)
    
    # Then resolve any [[prompts]] in the text
    text = resolve_llm_prompts(text, context_map, prompt_map, context_info)
    
    return text

def resolve_variables_in_blocks(blocks, variables, context_map, prompt_map, context_info=None):
    """
    Resolve variables in processed blocks, handling both plain text and formatted segments.
    
    Args:
        blocks: List of processed blocks from parse_lexical_json
        variables: List of variable definitions from the frontend
        context_map: Dictionary of context values
        prompt_map: Dictionary of prompt templates
        context_info: Optional list of relevant document chunks for context
        
    Returns:
        List of blocks with variables resolved
    """
    resolved_blocks = []
    
    for block in blocks:
        block_type = block[0]
        content = block[1]
        
        if block_type in ('heading', 'paragraph', 'quote', 'code'):
            if isinstance(content, str):
                # Handle plain text content
                resolved_text = resolve_variables_in_text(content, variables, context_map, prompt_map, context_info)
                if block_type == 'heading':
                    resolved_blocks.append(('heading', resolved_text, block[2]))
                elif block_type == 'code':
                    resolved_blocks.append(('code', resolved_text, block[2]))
                else:
                    resolved_blocks.append((block_type, resolved_text))
            else:
                # Handle formatted text segments
                resolved_segments = []
                for segment in content:
                    text = segment['text']
                    formatting = segment['format']
                    
                    # Check if this segment has a variable_id
                    if 'variable_id' in formatting and formatting['variable_id']:
                        # This is a variable segment - resolve it using the variable system
                        variable_id = formatting['variable_id']
                        variable_map = {var['id']: var for var in variables}
                        variable_def = variable_map.get(variable_id)
                        
                        if variable_def:
                            if variable_def['type'] == 'prompt':
                                # This is a prompt variable - use the prompt template
                                prompt_template = variable_def.get('prompt', '')
                                if prompt_template:
                                    # Resolve any {{placeholders}} in the prompt template
                                    filled_prompt = resolve_placeholders(prompt_template, context_map)
                                    # Call LLM to generate content
                                    resolved_text = call_llm(filled_prompt, context_info)
                                else:
                                    resolved_text = variable_def.get('defaultValue', '')
                            else:
                                # This is a regular variable - use default value or context
                                resolved_text = context_map.get(variable_def['name'], variable_def.get('defaultValue', ''))
                        else:
                            # Variable not found - use original text
                            resolved_text = text
                    else:
                        # Regular text segment - resolve placeholders and prompts
                        resolved_text = resolve_variables_in_text(text, variables, context_map, prompt_map, context_info)
                    
                    # Create new segment with resolved text
                    new_formatting = {k: v for k, v in formatting.items() if k != 'variable_id'}
                    resolved_segments.append({
                        'text': resolved_text,
                        'format': new_formatting
                    })
                
                if block_type == 'heading':
                    resolved_blocks.append(('heading', resolved_segments, block[2]))
                elif block_type == 'code':
                    # For code blocks, flatten to plain text
                    text = ''.join(seg['text'] for seg in resolved_segments)
                    resolved_blocks.append(('code', text, block[2]))
                else:
                    resolved_blocks.append((block_type, resolved_segments))
        elif block_type == 'list':
            # Handle list items
            items = block[1]
            list_type = block[2]
            resolved_items = []
            for item in items:
                resolved_item = resolve_variables_in_text(item, variables, context_map, prompt_map, context_info)
                resolved_items.append(resolved_item)
            resolved_blocks.append(('list', resolved_items, list_type))
        else:
            # Pass through other block types unchanged
            resolved_blocks.append(block)
    
    return resolved_blocks

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
