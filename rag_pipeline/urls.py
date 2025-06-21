from django.urls import path
from .views import upload_context, list_context, delete_context

app_name = 'rag_pipeline'

urlpatterns = [
    # Context management endpoints (internal RAG pipeline)
    path('upload/', upload_context, name='upload_context'),
    path('list/', list_context, name='list_context'),
    path('delete/<uuid:document_id>/', delete_context, name='delete_context'),
] 