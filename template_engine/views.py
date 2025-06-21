import json
from django.http import JsonResponse, HttpResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from .models import Template, Document, DocumentChunk
from .services.document_pipeline import process_lexical_document
from .services.lexical_processor import parse_lexical_json
from .services.placeholder_resolver import resolve_placeholders, extract_template_fields

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
    GET: List all templates.
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    templates = Template.objects.all()
    template_list = []
    
    for template in templates:
        template_list.append({
            'id': template.id,
            'name': template.name,
            'created_at': template.created_at.isoformat()
        })
    
    return JsonResponse({'templates': template_list})


def get_template(request, template_id):
    """
    GET: Get a specific template by ID.
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        template = Template.objects.get(id=template_id)
        return JsonResponse({
            'id': template.id,
            'name': template.name,
            'lexical_json': template.lexical_json,
            'created_at': template.created_at.isoformat()
        })
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Template not found.'}, status=404)


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

    return JsonResponse({
        'placeholders': sorted(placeholders),
        'prompts': sorted(prompts),
    })


@csrf_exempt
@require_http_methods(["POST"])
def generate_document(request):
    """
    Generate a PDF document from Lexical JSON content.
    """
    try:
        data = json.loads(request.body)
        template_id = data.get('template_id')
        context_map = data.get('context_map', {})
        prompt_map = data.get('prompt_map', {})
        
        if not template_id:
            return JsonResponse({'error': 'template_id is required'}, status=400)
        
        # Fetch the template from the database
        try:
            template = Template.objects.get(id=template_id)
        except Template.DoesNotExist:
            return JsonResponse({'error': 'Template not found'}, status=404)
        lexical_json = template.lexical_json
        
        # Get context info if template_id is provided
        context_info = None
        try:
            chunks = DocumentChunk.objects.filter(document__id=template_id)
            context_info = [
                {
                    'content': chunk.content,
                    'metadata': {
                        'source': chunk.document.name,
                        'chunk_id': chunk.id
                    }
                }
                for chunk in chunks
            ]
        except DocumentChunk.DoesNotExist:
            context_info = []
        
        # Process the document
        pdf_buffer = process_lexical_document(
            lexical_json, 
            context_map, 
            prompt_map, 
            context_info
        )
        
        # Create response with PDF content
        response = HttpResponse(
            pdf_buffer.getvalue(),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = 'attachment; filename="generated_document.pdf"'
        
        return response
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def extract_template_fields_view(request):
    """
    Extract template fields from Lexical JSON content.
    """
    try:
        data = json.loads(request.body)
        lexical_json = data.get('lexical_json')
        
        if not lexical_json:
            return JsonResponse({'error': 'lexical_json is required'}, status=400)
        
        fields = extract_template_fields(lexical_json)
        
        return JsonResponse({
            'template_fields': fields
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
