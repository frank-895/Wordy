import json
from django.http import JsonResponse, HttpResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from .models import Template
from .services.document_pipeline import process_lexical_document
from .services.lexical_processor import parse_lexical_json
from .services.placeholder_resolver import resolve_placeholders, extract_template_fields

# Import RAG pipeline models
from rag_pipeline.models import Document, DocumentChunk

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


@csrf_exempt
def list_templates(request):
    """
    GET: List all templates
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        templates = Template.objects.all().values('id', 'name', 'created_at')
        return JsonResponse({'templates': list(templates)})
    except Exception as e:
        return JsonResponse({'error': f"Failed to list templates: {str(e)}"}, status=500)


@csrf_exempt
def get_template(request, template_id):
    """
    GET: Get a specific template by ID
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
    except Template.DoesNotExist:
        return JsonResponse({'error': 'Template not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f"Failed to get template: {str(e)}"}, status=500)


@csrf_exempt
def update_template(request, template_id):
    """
    PUT: Update an existing template
    Body: { "name": "Updated Name", "lexical_json": {...} }
    """
    if request.method != 'PUT':
        return HttpResponseNotAllowed(['PUT'])

    try:
        data = json.loads(request.body)
        name = data.get('name')
        lexical_json = data.get('lexical_json')
        
        template = Template.objects.get(id=template_id)
        
        if name is not None:
            template.name = name
        if lexical_json is not None:
            template.lexical_json = lexical_json
            
        template.save()
        
        return JsonResponse({
            'id': template.id,
            'name': template.name,
            'message': 'Template updated successfully'
        })
        
    except Template.DoesNotExist:
        return JsonResponse({'error': 'Template not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Failed to update template: {str(e)}"}, status=500)


@csrf_exempt
def delete_template(request, template_id):
    """
    DELETE: Delete a template
    """
    if request.method != 'DELETE':
        return HttpResponseNotAllowed(['DELETE'])

    try:
        template = Template.objects.get(id=template_id)
        template_name = template.name
        template.delete()
        
        return JsonResponse({'message': f'Template "{template_name}" deleted successfully'})
        
    except Template.DoesNotExist:
        return JsonResponse({'error': 'Template not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f"Failed to delete template: {str(e)}"}, status=500)


@csrf_exempt
def template_fields(request, template_id):
    """
    GET: Extract fields (placeholders and prompts) from a template
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        template = Template.objects.get(id=template_id)
        fields = extract_template_fields(template.lexical_json)
        return JsonResponse(fields)
    except Template.DoesNotExist:
        return JsonResponse({'error': 'Template not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f"Failed to extract template fields: {str(e)}"}, status=500)


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
        
        # Get context documents associated with this template
        context_info = []
        try:
            documents = Document.objects.filter(template=template)
            for document in documents:
                chunks = DocumentChunk.objects.filter(document=document)
                for chunk in chunks:
                    context_info.append({
                        'content': chunk.content,
                        'metadata': {
                            'source': document.name,
                            'chunk_id': str(chunk.id),
                            'document_id': str(document.id),
                            'document_name': document.name
                        }
                    })
        except Exception as e:
            # If there's an error getting context, continue without it
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
def extract_template_fields_view(request):
    """
    POST: Extract fields from Lexical JSON content
    Body: { "lexical_json": {...} }
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        data = json.loads(request.body)
        lexical_json = data.get('lexical_json')
        
        if not lexical_json:
            return JsonResponse({'error': 'lexical_json is required'}, status=400)
            
        fields = extract_template_fields(lexical_json)
        return JsonResponse(fields)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f"Failed to extract fields: {str(e)}"}, status=500)
