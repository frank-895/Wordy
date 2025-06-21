from django.db import models
import uuid

class Template(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    lexical_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
