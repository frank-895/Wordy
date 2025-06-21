from django.urls import path
from .views import generate_docx

urlpatterns = [
    path('generate/', generate_docx, name='generate_docx'),
]
