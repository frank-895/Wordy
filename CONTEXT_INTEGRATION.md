# Context Integration

This document describes the context integration feature that allows users to upload and manage collateral material (context documents) for templates.

## Overview

The context integration feature enables users to:
- Upload context documents (PDF, DOCX, TXT) that are automatically associated with a specific template and session
- View all context documents associated with a template
- Delete context documents when no longer needed
- Use context documents during document generation to provide additional information for AI-generated content

## Architecture

### Backend Components

#### RAG Pipeline App (`rag_pipeline/`)
- **Models**: `Document` and `DocumentChunk` for storing context documents and their processed chunks
- **Services**: Document processing, text chunking, and embedding generation
- **Views**: Upload, list, delete, and session cleanup endpoints

#### Template Engine App (`template_engine/`)
- **Models**: `Template` for storing Lexical JSON templates
- **Services**: Document generation using context documents
- **Views**: Template CRUD and document generation endpoints

### Frontend Components

#### ContextManager (`frontend/src/components/ContextManager.tsx`)
- Displays context documents associated with a template
- Provides upload interface
- Allows deletion of context documents

#### ContextUpload (`frontend/src/components/ContextUpload.tsx`)
- Handles file uploads (PDF, DOCX, TXT)
- Automatically associates uploaded documents with template and session

## Data Flow

### Upload Process
1. User uploads a document through the ContextUpload component
2. Frontend sends file to `/api/rag/upload/` with `template_id` and `session_id`
3. Backend processes the document:
   - Extracts text content
   - Chunks the text into smaller segments
   - Generates embeddings for each chunk
   - Stores document and chunks in database
4. Document is automatically associated with the template and session

### Document Generation
1. User fills template form and clicks "Generate Document"
2. Frontend sends template data to `/api/template/generate_doc/`
3. Backend:
   - Retrieves all context documents associated with the template
   - Extracts chunks from each document
   - Uses context information during document generation
   - Returns generated PDF

### Session Management
- Each template fill session gets a unique `session_id`
- Context documents are tagged with both `template_id` and `session_id`
- Session cleanup endpoint (`/api/rag/cleanup/<session_id>/`) allows bulk deletion of session documents

## API Endpoints

### RAG Pipeline Endpoints

#### POST `/api/rag/upload/`
Upload and process a context document.

**Form Data:**
- `file` (optional): Uploaded file (PDF, DOCX)
- `content` (optional): Text content
- `name`: Document name
- `template_id`: Template ID to associate with
- `session_id`: Session ID for cleanup

**Response:**
```json
{
  "document_id": "uuid",
  "name": "Document Name",
  "file_type": "pdf",
  "template_id": "uuid",
  "session_id": "session_123",
  "created_at": "2024-01-01T00:00:00Z",
  "message": "Context document processed successfully"
}
```

#### GET `/api/rag/list/`
List context documents, optionally filtered by template or session.

**Query Parameters:**
- `template_id` (optional): Filter by template
- `session_id` (optional): Filter by session

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "name": "Document Name",
      "file_type": "pdf",
      "template_id": "uuid",
      "session_id": "session_123",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### DELETE `/api/rag/delete/<document_id>/`
Delete a specific context document.

**Response:**
```json
{
  "message": "Context document Document Name deleted successfully"
}
```

#### DELETE `/api/rag/cleanup/<session_id>/`
Delete all context documents for a session.

**Response:**
```json
{
  "message": "Deleted 5 context documents for session session_123",
  "deleted_count": 5
}
```

### Template Engine Endpoints

#### POST `/api/template/generate_doc/`
Generate a document using template and context.

**Request Body:**
```json
{
  "template_id": "uuid",
  "context_map": {
    "variable_name": "value"
  },
  "prompt_map": {
    "prompt_name": "AI prompt text"
  }
}
```

**Response:** PDF file download

## Database Schema

### Document Model (RAG Pipeline)
```python
class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    content = models.TextField(blank=True, null=True)
    file_path = models.CharField(max_length=500, blank=True, null=True)
    file_type = models.CharField(max_length=10)
    template = models.ForeignKey('template_engine.Template', on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### DocumentChunk Model (RAG Pipeline)
```python
class DocumentChunk(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    content = models.TextField()
    chunk_index = models.IntegerField()
    embedding = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
```

## Usage

### In Template Fill Form
The context integration is automatically available in the template fill form:

1. Navigate to a template's fill form
2. Scroll to the "Context Documents" section
3. Click "Show Upload" to reveal the upload interface
4. Drag and drop files or click "Choose File"
5. Uploaded documents are automatically associated with the template
6. View and delete context documents as needed
7. Generate the document - context will be used automatically

### Session-Based Cleanup
For long-term management, you can implement session cleanup:

```javascript
// After document generation or session end
await fetch(`/api/rag/cleanup/${sessionId}/`, {
  method: 'DELETE'
})
```

## Future Enhancements

- **Context Search**: Add semantic search within context documents
- **Context Preview**: Show document content previews
- **Context Categories**: Organize context documents by type or purpose
- **Context Templates**: Pre-defined context document templates
- **Context Sharing**: Share context documents between templates
- **Context Analytics**: Track context usage and effectiveness 