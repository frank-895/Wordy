from .lexical_processor import parse_lexical_json
from .placeholder_resolver import resolve_placeholders, resolve_llm_prompts, resolve_variables_in_blocks
from .pdf_generator import build_pdf

def process_lexical_document(lexical_json, context_map, prompt_map, context_info=None, variables=None):
    """
    Processes a Lexical JSON document by:
    - Parsing it into structured blocks
    - Resolving {{placeholders}}, [[prompt_keys]], and variable references
    - Generating a PDF file
    
    Args:
        lexical_json: The Lexical JSON content
        context_map: Dictionary of placeholder values
        prompt_map: Dictionary of prompt templates
        context_info: Optional list of relevant document chunks for context
        variables: Optional list of variable definitions from the frontend
    """
    if context_info is None:
        context_info = []
    
    if variables is None:
        variables = []

    blocks = parse_lexical_json(lexical_json)
    
    # Use the new variable resolution system
    processed_blocks = resolve_variables_in_blocks(blocks, variables, context_map, prompt_map, context_info)
    
    # Generate PDF from processed blocks
    pdf_buffer = build_pdf(processed_blocks)
    
    return pdf_buffer
