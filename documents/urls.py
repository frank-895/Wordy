from django.urls import path
from .views import UploadDocumentView, SessionDocumentListView

urlpatterns = [
    path('upload/', UploadDocumentView.as_view(), name='upload-document'),
    path('', SessionDocumentListView.as_view(), name='list-documents'),
]
