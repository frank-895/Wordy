from django.shortcuts import render
import json
import uuid
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from .models import Document
from .services.rag_pipeline import RAGPipeline


def _validate_uuid(uuid_string):
    """
    Validate and convert string to UUID.
    If already a UUID object, return as is.
    """
    if isinstance(uuid_string, uuid.UUID):
        return uuid_string
    try:
        return uuid.UUID(uuid_string)
    except (ValueError, TypeError):
        raise ValueError(f"Invalid UUID format: {uuid_string}")


@csrf_exempt
def upload_context(request):
    """
    POST: Upload and process a document (PDF, DOCX, or text) for internal RAG pipeline
    Body: Form data with 'file' (for file uploads) or 'content' (for text), 'name', 'template_id', and 'session_id'
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        rag_pipeline = RAGPipeline()
        
        # Get template_id and session_id from form data
        template_id = request.POST.get('template_id')
        session_id = request.POST.get('session_id')
        
        # Validate template_id if provided
        if template_id:
            try:
                validated_template_id = _validate_uuid(template_id)
            except ValueError as e:
                return JsonResponse({'error': str(e)}, status=400)
        else:
            validated_template_id = None
        
        # Check if it's a file upload or text content
        if 'file' in request.FILES:
            # File upload (PDF, DOCX)
            file_obj = request.FILES['file']
            name = request.POST.get('name', file_obj.name)
            
            document = rag_pipeline.process_file_document(name, file_obj, str(validated_template_id) if validated_template_id else None, session_id)
            
        elif 'content' in request.POST:
            # Text content
            content = request.POST['content']
            name = request.POST.get('name', 'Text Document')
            
            document = rag_pipeline.process_text_document(name, content, str(validated_template_id) if validated_template_id else None, session_id)
            
        else:
            return JsonResponse({'error': 'Either file or content must be provided'}, status=400)

        return JsonResponse({
            'document_id': str(document.id),
            'name': document.name,
            'file_type': document.file_type,
            'template_id': str(document.template.id) if document.template else None,
            'session_id': document.session_id,
            'created_at': document.created_at.isoformat(),
            'message': 'Context document processed successfully'
        }, status=201)

    except Exception as e:
        return JsonResponse({'error': f"Context processing failed: {str(e)}"}, status=500)


def list_context(request):
    """
    GET: List all processed context documents, optionally filtered by template_id
    Query params: template_id (optional), session_id (optional)
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        template_id = request.GET.get('template_id')
        session_id = request.GET.get('session_id')
        
        documents = Document.objects.all()
        
        if template_id:
            try:
                validated_template_id = _validate_uuid(template_id)
                documents = documents.filter(template_id=validated_template_id)
            except ValueError as e:
                return JsonResponse({'error': str(e)}, status=400)
        
        if session_id:
            documents = documents.filter(session_id=session_id)
            
        documents = documents.values('id', 'name', 'file_type', 'template_id', 'session_id', 'created_at')
        return JsonResponse({'documents': list(documents)})
    except Exception as e:
        return JsonResponse({'error': f"Failed to list context documents: {str(e)}"}, status=500)


@csrf_exempt
def delete_context(request, document_id):
    """
    DELETE: Delete a context document and all its chunks
    """
    if request.method != 'DELETE':
        return HttpResponseNotAllowed(['DELETE'])

    try:
        # Validate document_id
        try:
            validated_document_id = _validate_uuid(document_id)
        except ValueError as e:
            return JsonResponse({'error': str(e)}, status=400)
        
        document = Document.objects.get(id=validated_document_id)
        document.delete()  # This will cascade delete chunks due to ForeignKey relationship
        
        return JsonResponse({'message': f'Context document {document.name} deleted successfully'})
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Context document not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f"Failed to delete context document: {str(e)}"}, status=500)


@csrf_exempt
def cleanup_session(request, session_id):
    """
    DELETE: Delete all context documents for a specific session
    """
    if request.method != 'DELETE':
        return HttpResponseNotAllowed(['DELETE'])

    try:
        print(f"🔧 CLEANUP: Attempting to cleanup session: {session_id}")
        documents = Document.objects.filter(session_id=session_id)
        count = documents.count()
        print(f"🔧 CLEANUP: Found {count} documents for session {session_id}")
        
        if count > 0:
            documents.delete()  # This will cascade delete chunks
            print(f"🔧 CLEANUP: Successfully deleted {count} documents for session {session_id}")
        else:
            print(f"🔧 CLEANUP: No documents found for session {session_id}")
        
        return JsonResponse({
            'message': f'Deleted {count} context documents for session {session_id}',
            'deleted_count': count
        })
    except Exception as e:
        print(f"🔧 CLEANUP: Error cleaning up session {session_id}: {str(e)}")
        return JsonResponse({'error': f"Failed to cleanup session: {str(e)}"}, status=500)
