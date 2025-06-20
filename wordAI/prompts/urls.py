from django.urls import path
from .views import StructuredPromptView

urlpatterns = [
    path('generate/', StructuredPromptView.as_view(), name='generate'),
]