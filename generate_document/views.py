import json
from django.http import HttpResponse, JsonResponse
from .services.document_pipeline import process_lexical_document

def generate_docx(request):
    if request.method != 'POST':
        return HttpResponse(status=405)

    try:
        data = json.loads(request.body)
        lexical_json = data['lexical_json']
        context_map = data['context_map']
        prompt_map = data.get('prompt_map', {})
    except (KeyError, json.JSONDecodeError):
        return JsonResponse({'error': 'Invalid input. Required: lexical_json, context_map.'}, status=400)

    try:
        docx_buffer = process_lexical_document(lexical_json, context_map, prompt_map)
        response = HttpResponse(
            docx_buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = 'attachment; filename="output.docx"'
        return response

    except Exception as e:
        return JsonResponse({'error': f"Processing failed: {str(e)}"}, status=500)
