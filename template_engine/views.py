import json
import logging
from django.http import JsonResponse, HttpResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from .models import Template
from .services.document_pipeline import process_lexical_document
from .services.lexical_processor import parse_lexical_json
from .services.placeholder_resolver import resolve_placeholders, extract_template_fields

# Import RAG pipeline models and services
from rag_pipeline.models import Document, DocumentChunk
from rag_pipeline.services.rag_pipeline import RAGPipeline

# Set up logging
logger = logging.getLogger(__name__)

@csrf_exempt
def create_template(request):
    """
    POST: Save a new Lexical JSON template.
    Body: { "name": "My Template", "lexical_json": {...}, "variables": [...] }
    """

    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        data = json.loads(request.body)
        name = data['name']
        lexical_json = data['lexical_json']
        variables = data.get('variables', [])  # New: handle variables array
    except (KeyError, json.JSONDecodeError):
        return JsonResponse({'error': 'Invalid input. Required: name, lexical_json.'}, status=400)

    # Store both lexical_json and variables in the template
    template_data = {
        'lexical_json': lexical_json,
        'variables': variables
    }
    
    template = Template.objects.create(name=name, lexical_json=template_data)
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
        template_data = template.lexical_json
        
        # Handle both old format (just lexical_json) and new format (with variables)
        if isinstance(template_data, dict) and 'lexical_json' in template_data:
            # New format with variables
            lexical_json = template_data['lexical_json']
            variables = template_data.get('variables', [])
        else:
            # Old format - just lexical_json
            lexical_json = template_data
            variables = []
        
        return JsonResponse({
            'id': template.id,
            'name': template.name,
            'lexical_json': lexical_json,
            'variables': variables,
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
    Body: { "name": "Updated Name", "lexical_json": {...}, "variables": [...] }
    """
    if request.method != 'PUT':
        return HttpResponseNotAllowed(['PUT'])

    try:
        data = json.loads(request.body)
        name = data.get('name')
        lexical_json = data.get('lexical_json')
        variables = data.get('variables', [])  # New: handle variables array
        
        template = Template.objects.get(id=template_id)
        
        if name is not None:
            template.name = name
        if lexical_json is not None:
            # Store both lexical_json and variables in the template
            template_data = {
                'lexical_json': lexical_json,
                'variables': variables
            }
            template.lexical_json = template_data
            
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
        template_data = template.lexical_json
        
        # Handle both old format (just lexical_json) and new format (with variables)
        if isinstance(template_data, dict) and 'lexical_json' in template_data:
            # New format with variables
            lexical_json = template_data['lexical_json']
            variables = template_data.get('variables', [])
        else:
            # Old format - just lexical_json
            lexical_json = template_data
            variables = []
        
        fields = extract_template_fields(lexical_json)
        
        # Add variable information to the response
        fields['variables'] = variables
        
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
        
        logger.info(f"🔍 RAG DEBUG: Starting document generation for template {template_id}")
        logger.info(f"🔍 RAG DEBUG: Context map: {context_map}")
        logger.info(f"🔍 RAG DEBUG: Prompt map: {prompt_map}")
        
        # Fetch the template from the database
        try:
            template = Template.objects.get(id=template_id)
        except Template.DoesNotExist:
            return JsonResponse({'error': 'Template not found'}, status=404)
        
        template_data = template.lexical_json
        
        # Handle both old format (just lexical_json) and new format (with variables)
        if isinstance(template_data, dict) and 'lexical_json' in template_data:
            # New format with variables
            lexical_json = template_data['lexical_json']
            variables = template_data.get('variables', [])
        else:
            # Old format - just lexical_json
            lexical_json = template_data
            variables = []
        
        logger.info(f"🔍 RAG DEBUG: Template has {len(variables)} variables")
        
        # Get context documents associated with this template
        context_info = []
        try:
            documents = Document.objects.filter(template=template)
            logger.info(f"🔍 RAG DEBUG: Found {documents.count()} context documents for template")
            
            if documents.exists():
                # Initialize RAG pipeline for semantic search
                rag_pipeline = RAGPipeline()
                
                # Extract all prompts and placeholders to use as search queries
                search_queries = []
                
                # Add variable prompts as search queries
                for variable in variables:
                    if variable.get('type') == 'prompt':
                        prompt = variable.get('prompt', '')
                        if prompt:
                            search_queries.append(prompt)
                            logger.info(f"🔍 RAG DEBUG: Added variable prompt as search query: {prompt[:50]}...")
                
                # Add prompt_map values as search queries
                for prompt_key, prompt_value in prompt_map.items():
                    if prompt_value:
                        search_queries.append(prompt_value)
                        logger.info(f"🔍 RAG DEBUG: Added prompt_map value as search query: {prompt_value[:50]}...")
                
                # If no specific queries, use a general search
                if not search_queries:
                    search_queries = ["general information", "context", "background"]
                    logger.info("🔍 RAG DEBUG: No specific queries found, using general search terms")
                
                # Get relevant chunks for each search query
                all_relevant_chunks = []
                for query in search_queries:
                    logger.info(f"🔍 RAG DEBUG: Searching for chunks relevant to: {query[:50]}...")
                    relevant_chunks = rag_pipeline.get_similar_chunks_internal(query, top_k=3)
                    logger.info(f"🔍 RAG DEBUG: Found {len(relevant_chunks)} relevant chunks for query")
                    
                    for chunk in relevant_chunks:
                        # Check if this chunk is already in our list (avoid duplicates)
                        chunk_id = chunk['chunk_id']
                        if not any(c.get('chunk_id') == chunk_id for c in all_relevant_chunks):
                            all_relevant_chunks.append(chunk)
                            logger.info(f"🔍 RAG DEBUG: Added chunk {chunk_id} from {chunk['document_name']} (similarity: {chunk['similarity_score']:.3f})")
                
                # Sort by similarity score and take top results
                all_relevant_chunks.sort(key=lambda x: x['similarity_score'], reverse=True)
                context_info = all_relevant_chunks[:10]  # Limit to top 10 most relevant chunks
                
                logger.info(f"🔍 RAG DEBUG: Final context info contains {len(context_info)} unique chunks")
                
            else:
                logger.info("🔍 RAG DEBUG: No context documents found for template")
                
        except Exception as e:
            logger.error(f"🔍 RAG DEBUG: Error getting context: {str(e)}")
            # If there's an error getting context, continue without it
            context_info = []
        
        # Process the document with variables
        pdf_buffer = process_lexical_document(
            lexical_json, 
            context_map, 
            prompt_map, 
            context_info,
            variables
        )
        
        logger.info(f"🔍 RAG DEBUG: Document generation completed successfully")
        
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
        logger.error(f"🔍 RAG DEBUG: Error in document generation: {str(e)}")
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
