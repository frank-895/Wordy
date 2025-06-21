# views.py

import json
from django.http import HttpResponse
from .services.lexical_processor import parse_lexical_json
from .services.placeholder_resolver import resolve_placeholders, resolve_llm_blocks
from .services.docx_generator import build_docx

def generate_docx(request):
    if request.method != 'POST':
        return HttpResponse(status=405)

    try:
        data = json.loads(request.body)
        lexical_json = data['lexical_json']
        context_map = data['context_map']
    except (KeyError, json.JSONDecodeError):
        return HttpResponse("Invalid input", status=400)

    # Step 1: Parse Lexical JSON to blocks
    blocks = parse_lexical_json(lexical_json)

    # Step 2: Replace placeholders and LLM prompts
    processed_blocks = []
    for block in blocks:
        if block[0] == 'paragraph':
            text = resolve_placeholders(block[1], context_map)
            text = resolve_llm_blocks(text, context_map)
            processed_blocks.append(('paragraph', text))
        elif block[0] == 'heading':
            text = resolve_placeholders(block[1], context_map)
            text = resolve_llm_blocks(text, context_map)
            processed_blocks.append(('heading', text, block[2]))

    # Step 3: Generate Word Document
    docx_buffer = build_docx(processed_blocks)

    # Step 4: Return the file as response
    response = HttpResponse(docx_buffer.read(), content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    response['Content-Disposition'] = 'attachment; filename="output.docx"'
    return response