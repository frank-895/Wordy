from django.urls import path
from .views import save_template, list_templates, form_fields, generate_document

urlpatterns = [
    path('save_template/', save_template, name='save_template'),
    path('list_templates/', list_templates, name='list_templates'),
    path('form-fields/<int:template_id>/', form_fields, name='form_fields'),
    path('generate_document/', generate_document, name='generate_document'),
]