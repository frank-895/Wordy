from .lexical_processor import parse_lexical_json
from .placeholder_resolver import resolve_placeholders, resolve_llm_prompts
from .docx_generator import build_docx

def process_lexical_document(lexical_json, context_map, prompt_map):
    """
    Processes a Lexical JSON document by:
    - Parsing it into structured blocks
    - Resolving {{placeholders}} and [[prompt_keys]]
    - Generating a DOCX file
    """
    blocks = parse_lexical_json(lexical_json)
    processed_blocks = []

    for block in blocks:
        block_type = block[0]

        if block_type in ('heading', 'paragraph', 'quote', 'code'):
            text = resolve_placeholders(block[1], context_map)
            text = resolve_llm_prompts(text, context_map, prompt_map)
            if block_type == 'heading':
                processed_blocks.append(('heading', text, block[2]))
            elif block_type == 'code':
                processed_blocks.append(('code', text, block[2]))
            else:
                processed_blocks.append((block_type, text))

        elif block_type == 'list':
            resolved_items = [
                resolve_llm_prompts(resolve_placeholders(item, context_map), context_map, prompt_map)
                for item in block[1]
            ]
            processed_blocks.append(('list', resolved_items, block[2]))

        else:
            processed_blocks.append(('paragraph', f"[Unsupported block type: {block_type}]"))

    return build_docx(processed_blocks)
