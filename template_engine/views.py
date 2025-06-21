import json
from django.http import JsonResponse, HttpResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from .models import Template

from .services.document_pipeline import process_lexical_document
from .services.lexical_processor import parse_lexical_json
from .services.placeholder_resolver import resolve_placeholders
from django.core.exceptions import ObjectDoesNotExist

# Import RAG pipeline for context retrieval
from rag_pipeline.services.rag_pipeline import RAGPipeline

@csrf_exempt
def create_template(request):
    """
    POST: Save a new Lexical JSON template.
    Body: { "name": "My Template", "lexical_json": {...} }
    """

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        data = json.loads(request.body)
        name = data['name']
        lexical_json = data['lexical_json']
    except (KeyError, json.JSONDecodeError):
        return JsonResponse({'error': 'Invalid input. Required: name, lexical_json.'}, status=400)

    template = Template.objects.create(name=name, lexical_json=lexical_json)
    return JsonResponse({'id': template.id, 'name': template.name}, status=201)


def list_templates(request):
    """
    GET: List all available templates.
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    templates = Template.objects.all().values('id', 'name', 'created_at')
    return JsonResponse({'templates': list(templates)})


def get_template(request, template_id):
    """
    GET: Get a specific template by ID.
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        template = Template.objects.get(id=template_id)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Template not found.'}, status=404)

    return JsonResponse({
        'id': template.id,
        'name': template.name,
        'lexical_json': template.lexical_json,
        'created_at': template.created_at
    })


@csrf_exempt
def update_template(request, template_id):
    """
    PUT: Update an existing template.
    Body: { "name": "Updated Template", "lexical_json": {...} }
    """
    if request.method != 'PUT':
        return HttpResponseNotAllowed(['PUT'])

    try:
        template = Template.objects.get(id=template_id)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Template not found.'}, status=404)

    try:
        data = json.loads(request.body)
        name = data.get('name')
        lexical_json = data.get('lexical_json')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON input.'}, status=400)

    if name is not None:
        template.name = name
    if lexical_json is not None:
        template.lexical_json = lexical_json

    template.save()
    return JsonResponse({'id': template.id, 'name': template.name})


@csrf_exempt
def delete_template(request, template_id):
    """
    DELETE: Delete a template.
    """
    if request.method != 'DELETE':
        return HttpResponseNotAllowed(['DELETE'])

    try:
        template = Template.objects.get(id=template_id)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Template not found.'}, status=404)

    template.delete()
    return JsonResponse({'message': 'Template deleted successfully.'}, status=204)


def template_fields(request, template_id):
    """
    GET: Return all placeholders and prompt keys in a given template.
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        template = Template.objects.get(id=template_id)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Template not found.'}, status=404)

    blocks = parse_lexical_json(template.lexical_json)
    placeholder_pattern = r"\{\{(.*?)\}\}"
    prompt_pattern = r"\[\[(.*?)\]\]"

    import re
    placeholders = set()
    prompts = set()

    for block in blocks:
        if isinstance(block[1], str):
            placeholders.update(re.findall(placeholder_pattern, block[1]))
            prompts.update(re.findall(prompt_pattern, block[1]))
        elif isinstance(block[1], list):  # list block
            for item in block[1]:
                placeholders.update(re.findall(placeholder_pattern, item))
                prompts.update(re.findall(prompt_pattern, item))

    return JsonResponse({
        'placeholders': sorted(placeholders),
        'prompts': sorted(prompts),
    })


@csrf_exempt
def generate_document(request):
    """
    POST: Fill a saved template with context and prompt data and return a .docx
    Body: {
        "template_id": 1,
        "context_map": { "name": "Alice" },
        "prompt_map": { "summary": "Write a short summary about {{name}}" }
    }
    
    The system will:
    1. Extract all prompts from prompt_map
    2. Use RAG pipeline to find top 3 most relevant chunks as context
    3. Pass context as secondary information to LLM prompts
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        data = json.loads(request.body)
        template_id = data['template_id']
        context_map = data['context_map']
        prompt_map = data.get('prompt_map', {})
    except (KeyError, json.JSONDecodeError):
        return JsonResponse({'error': 'Invalid input. Required: template_id, context_map.'}, status=400)

    try:
        template = Template.objects.get(id=template_id)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Template not found.'}, status=404)

    try:
        # Initialize RAG pipeline for context retrieval
        rag_pipeline = RAGPipeline()
        
        # Extract all prompts from prompt_map to create a search query
        all_prompts = []
        for prompt_key, prompt_template in prompt_map.items():
            # Resolve placeholders in the prompt template to get the actual prompt text
            resolved_prompt = resolve_placeholders(prompt_template, context_map)
            all_prompts.append(resolved_prompt)
        
        # Combine all prompts into a single search query
        search_query = " ".join(all_prompts) if all_prompts else "document generation"
        
        # Get top 3 most relevant chunks as context
        relevant_chunks = rag_pipeline.get_similar_chunks_internal(search_query, top_k=3)
        
        # Format context from relevant chunks
        context_info = []
        for chunk in relevant_chunks:
            context_info.append({
                'content': chunk['content'],
                'document_name': chunk['document_name'],
                'similarity_score': chunk['similarity_score']
            })
        
        # Pass context to document generation process
        docx_buffer = process_lexical_document(
            template.lexical_json, 
            context_map, 
            prompt_map, 
            context_info
        )
        
        response = HttpResponse(
            docx_buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = 'attachment; filename="output.docx"'
        return response

    except Exception as e:
        return JsonResponse({'error': f"Document generation failed: {str(e)}"}, status=500)
