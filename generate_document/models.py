from django.db import models

class Template(models.Model):
    name = models.CharField(max_length=255)
    lexical_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
