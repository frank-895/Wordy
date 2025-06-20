from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from .models import DocumentContext
from .serializers import DocumentContextSerializer

class UploadDocumentView(APIView):
    parser_classes = [MultiPartParser]  # allows file upload

    def post(self, request):
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
