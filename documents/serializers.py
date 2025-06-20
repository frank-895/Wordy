from rest_framework import serializers
from .models import DocumentContext

class DocumentContextSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField()

    class Meta:
        model = DocumentContext
        fields = ['id', 'session_id', 'original_file', 'uploaded_at', 'extracted_text', 'filename']

    def get_filename(self, obj):
        return obj.original_file.name.split("/")[-1]
