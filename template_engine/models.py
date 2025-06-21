from django.db import models
import uuid

class Template(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    lexical_json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)


class Document(models.Model):
    """
    Model to store uploaded documents and their metadata
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500, null=True, blank=True)  # For file uploads
    content = models.TextField(null=True, blank=True)  # For direct text input
    file_type = models.CharField(max_length=10, choices=[
        ('text', 'Text'),
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.file_type})"


class DocumentChunk(models.Model):
    """
    Model to store individual chunks of documents with their embeddings
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    content = models.TextField()
    chunk_index = models.IntegerField()  # Order of chunk in document
    embedding = models.JSONField(null=True, blank=True)  # Store embedding vector as JSON
    metadata = models.JSONField(default=dict, blank=True)  # Store additional metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['document', 'chunk_index']
        unique_together = ['document', 'chunk_index']
    
    def __str__(self):
        return f"Chunk {self.chunk_index} of {self.document.name}"
