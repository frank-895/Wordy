from .lexical_processor import parse_lexical_json
from .placeholder_resolver import resolve_placeholders, resolve_llm_prompts
from .pdf_generator import build_pdf

def process_lexical_document(lexical_json, context_map, prompt_map, context_info=None):
    """
    Processes a Lexical JSON document by:
    - Parsing it into structured blocks
    - Resolving {{placeholders}} and [[prompt_keys]]
    - Generating a PDF file
    
    Args:
        lexical_json: The Lexical JSON content
        context_map: Dictionary of placeholder values
        prompt_map: Dictionary of prompt templates
        context_info: Optional list of relevant document chunks for context
    """
    blocks = parse_lexical_json(lexical_json)
    processed_blocks = []

    for block in blocks:
        block_type = block[0]
        content = block[1]

        if block_type in ('heading', 'paragraph', 'quote', 'code'):
            if isinstance(content, str):
                # Handle plain text content
                text = resolve_placeholders(content, context_map)
                text = resolve_llm_prompts(text, context_map, prompt_map, context_info)
                if block_type == 'heading':
                    processed_blocks.append(('heading', text, block[2]))
                elif block_type == 'code':
                    processed_blocks.append(('code', text, block[2]))
                else:
                    processed_blocks.append((block_type, text))
            else:
                # Handle formatted text segments
                processed_segments = []
                for segment in content:
                    text = segment['text']
                    formatting = segment['format']
                    
                    # Resolve placeholders and prompts in the text
                    resolved_text = resolve_placeholders(text, context_map)
                    resolved_text = resolve_llm_prompts(resolved_text, context_map, prompt_map, context_info)
                    
                    processed_segments.append({
                        'text': resolved_text,
                        'format': formatting
                    })
                
                if block_type == 'heading':
                    processed_blocks.append(('heading', processed_segments, block[2]))
                elif block_type == 'code':
                    # For code blocks, flatten to plain text
                    text = ''.join(seg['text'] for seg in processed_segments)
                    processed_blocks.append(('code', text, block[2]))
                else:
                    processed_blocks.append((block_type, processed_segments))

        elif block_type == 'list':
            if isinstance(content[0], str):
                # Handle plain text list items
                resolved_items = [
                    resolve_llm_prompts(resolve_placeholders(item, context_map), context_map, prompt_map, context_info)
                    for item in content
                ]
                processed_blocks.append(('list', resolved_items, block[2]))
            else:
                # Handle formatted list items
                resolved_items = []
                for item_segments in content:
                    processed_item_segments = []
                    for segment in item_segments:
                        text = segment['text']
                        formatting = segment['format']
                        
                        resolved_text = resolve_placeholders(text, context_map)
                        resolved_text = resolve_llm_prompts(resolved_text, context_map, prompt_map, context_info)
                        
                        processed_item_segments.append({
                            'text': resolved_text,
                            'format': formatting
                        })
                    resolved_items.append(processed_item_segments)
                processed_blocks.append(('list', resolved_items, block[2]))

        else:
            processed_blocks.append(('paragraph', f"[Unsupported block type: {block_type}]"))

    return build_pdf(processed_blocks)
