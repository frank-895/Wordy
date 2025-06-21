from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/template/', include('template_engine.urls')),
    path('api/rag/', include('rag_pipeline.urls')),
    # for serving media files during development only
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)