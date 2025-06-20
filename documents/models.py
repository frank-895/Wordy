from contextlib import nullcontext
from django.db import models

class DocumentContext(models.Model):
    """
    Model representing a document uploaded by a user, associated with a session.
    Stores the original file, upload timestamp, and extracted text.
    """
    session_id = models.CharField(max_length=100, db_index=True)
    original_file = models.FileField(upload_to='uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    extracted_text = models.TextField(blank=True)  # leave empty for now

    def __str__(self):
        return f"{self.original_file.name} ({self.session_id})"

class DocumentChunk(models.Model):
    """
    Model representing a chunk of a document, used for storing content and embeddings.
    Each chunk is linked to a DocumentContext and a session.
    """
    session_id = models.CharField(max_length=100, db_index=True)
    document = models.ForeignKey('DocumentContext', on_delete=models.CASCADE, related_name='chunks')
    content = models.TextField()
    embedding = models.JSONField()  # Stores vector as a list of floats
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chunk ({self.id}) for session {self.session_id}"

