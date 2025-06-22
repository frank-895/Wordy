from django.contrib import admin
from .models import Document, DocumentChunk


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('name', 'file_type', 'created_at', 'updated_at')
    search_fields = ('name',)
    list_filter = ('file_type', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ('document', 'chunk_index', 'created_at', 'has_embedding')
    list_filter = ('created_at', 'document')
    search_fields = ('document__name', 'content')
    readonly_fields = ('id', 'created_at')
    
    def has_embedding(self, obj):
        return obj.embedding is not None
    has_embedding.boolean = True
    has_embedding.short_description = 'Has Embedding'
