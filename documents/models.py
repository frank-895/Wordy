from django.db import models

class DocumentContext(models.Model):
    session_id = models.CharField(max_length=100, db_index=True)
    original_file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    extracted_text = models.TextField(blank=True)  # leave empty for now

    def __str__(self):
        return f"{self.original_file.name} ({self.session_id})"
