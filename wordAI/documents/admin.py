from django.contrib import admin
from .models import DocumentContext

@admin.register(DocumentContext)
class DocumentContextAdmin(admin.ModelAdmin):
    list_display = ('id', 'session_id', 'original_file', 'uploaded_at')
    search_fields = ('session_id',)
    readonly_fields = ('uploaded_at',)
