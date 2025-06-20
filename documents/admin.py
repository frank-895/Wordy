from django.contrib import admin
from .models import DocumentChunk, DocumentContext

@admin.register(DocumentContext)
class DocumentContextAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_id', 'original_file', 'uploaded_at')
    search_fields = ('session_id',)
    readonly_fields = ('uploaded_at',)


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_id', 'document', 'created_at')
    search_fields = ('session_id',)
    readonly_fields = ('created_at',)