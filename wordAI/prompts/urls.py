from django.urls import path
from .views import SimplePromptView

urlpatterns = [
    path('generate/', SimplePromptView.as_view(), name='simple-generate'),
]