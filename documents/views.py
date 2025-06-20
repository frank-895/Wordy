from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from .models import DocumentContext
from .serializers import DocumentContextSerializer
from rest_framework.generics import ListAPIView
from core.mixins import RequireSessionMixin

class UploadDocumentView(RequireSessionMixin, APIView):
    """
    API view to handle uploading documents associated with a session.
    Accepts multipart file uploads and creates a DocumentContext instance.
    """
    parser_classes = [MultiPartParser]  # allows file upload

    def post(self, request):
        """
        Handle POST requests to upload a document.
        Expects 'session_id' in request data and 'file' in request files.
        Returns the serialized DocumentContext instance or an error message.
        """
        session_id = request.data.get('session_id')
        file_obj = request.FILES.get('file')

        if not session_id:
            return Response({'error': 'Missing session_id'}, status=400)
        if not file_obj:
            return Response({'error': 'Missing file'}, status=400)

        doc = DocumentContext.objects.create(
            session_id=session_id,
            original_file=file_obj
        )

        serializer = DocumentContextSerializer(doc)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
