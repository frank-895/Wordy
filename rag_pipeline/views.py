from django.shortcuts import render
import json
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from .models import Document
from .services.rag_pipeline import RAGPipeline


@csrf_exempt
def upload_context(request):
    """
    POST: Upload and process a document (PDF, DOCX, or text) for internal RAG pipeline
    Body: Form data with 'file' (for file uploads) or 'content' (for text) and 'name'
    """
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        rag_pipeline = RAGPipeline()
        
        # Check if it's a file upload or text content
        if 'file' in request.FILES:
            # File upload (PDF, DOCX)
            file_obj = request.FILES['file']
            name = request.POST.get('name', file_obj.name)
            
            document = rag_pipeline.process_file_document(name, file_obj)
            
        elif 'content' in request.POST:
            # Text content
            content = request.POST['content']
            name = request.POST.get('name', 'Text Document')
            
            document = rag_pipeline.process_text_document(name, content)
            
        else:
            return JsonResponse({'error': 'Either file or content must be provided'}, status=400)

        return JsonResponse({
            'document_id': str(document.id),
            'name': document.name,
            'file_type': document.file_type,
            'created_at': document.created_at.isoformat(),
            'message': 'Context document processed successfully'
        }, status=201)

    except Exception as e:
        return JsonResponse({'error': f"Context processing failed: {str(e)}"}, status=500)


def list_context(request):
    """
    GET: List all processed context documents
    """
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])

    try:
        documents = Document.objects.all().values('id', 'name', 'file_type', 'created_at')
        return JsonResponse({'documents': list(documents)})
    except Exception as e:
        return JsonResponse({'error': f"Failed to list context documents: {str(e)}"}, status=500)


def delete_context(request, document_id):
    """
    DELETE: Delete a context document and all its chunks
    """
    if request.method != 'DELETE':
        return HttpResponseNotAllowed(['DELETE'])

    try:
        document = Document.objects.get(id=document_id)
        document.delete()  # This will cascade delete chunks due to ForeignKey relationship
        
        return JsonResponse({'message': f'Context document {document.name} deleted successfully'})
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Context document not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f"Failed to delete context document: {str(e)}"}, status=500)
