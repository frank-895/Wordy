from rest_framework import serializers
from .models import DocumentContext

class DocumentContextSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentContext
        fields = '__all__'
