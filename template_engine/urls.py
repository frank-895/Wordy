from django.urls import path
from .views import (
    create_template, list_templates, get_template, update_template, 
    delete_template, template_fields, generate_document
)

urlpatterns = [
    # Template CRUD endpoints
    path('add/', create_template, name='create_template'),
    path('', list_templates, name='list_templates'),
    path('<uuid:template_id>/', get_template, name='get_template'),
    path('<uuid:template_id>/edit/', update_template, name='update_template'),
    path('<uuid:template_id>/delete/', delete_template, name='delete_template'),
    path('<uuid:template_id>/fields/', template_fields, name='template_fields'),
    
    # Document generation endpoint
    path('generate_doc/', generate_document, name='generate_document'),
]