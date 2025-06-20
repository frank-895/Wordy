from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.generics import ListAPIView

from .models import DocumentContext
from .serializers import DocumentContextSerializer
from documents.utils import extract_text_from_file, create_chunks_and_embeddings

from core.mixins import RequireSessionMixin, SessionMissingException


class UploadDocumentView(APIView, RequireSessionMixin):
    """
    API view to handle uploading documents associated with a session.
    Accepts multipart file uploads and creates a DocumentContext instance.
    """
    parser_classes = [MultiPartParser]

    def post(self, request):
        """
        Handle POST requests to upload a document.
        Expects 'session_id' in request data and 'file' in request files.
        Returns the serialized DocumentContext instance or an error message.
        """
        try:
            session_id = self.get_session_id(request)
        except SessionMissingException as e:
            return Response({"error": str(e)}, status=400)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'Missing file'}, status=400)

        # Save file first so we can access the file path
        doc = DocumentContext.objects.create(
            session_id=session_id,
            original_file=file_obj
        )

        # Now extract and save text
        extracted = extract_text_from_file(doc.original_file)
        doc.extracted_text = extracted
        doc.save()
        
        # now create vector chunks
        create_chunks_and_embeddings(doc)

        serializer = DocumentContextSerializer(doc)
        return Response(serializer.data, status=201)
    
class SessionDocumentListView(RequireSessionMixin, ListAPIView):
    """
    API view to list all documents associated with a given session_id.
    Returns an empty queryset if session_id is not provided.
    """
    serializer_class = DocumentContextSerializer

    def get_queryset(self):
        """
        Return a queryset of DocumentContext objects filtered by session_id.
        If session_id is not provided, returns an empty queryset.
        """
        session_id = self.request.query_params.get('session_id')
        if not session_id:
            return DocumentContext.objects.none()
        return DocumentContext.objects.filter(session_id=session_id).order_by('-uploaded_at')
