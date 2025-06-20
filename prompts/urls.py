from django.urls import path
from .views import StructuredPromptView, WordyCommandView

urlpatterns = [
    path('generate/', StructuredPromptView.as_view(), name='generate'),
    path('wordy/', WordyCommandView.as_view(), name='wordy_command'),
]