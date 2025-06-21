# Context Integration for Document Generation

## Overview

The `generate_document` endpoint now includes intelligent context retrieval from the RAG pipeline. When generating documents with LLM prompts, the system automatically finds the top 3 most relevant document chunks from the database and provides them as secondary context to the LLM.

## How It Works

### 1. Prompt Extraction
- The system extracts all prompts from the `prompt_map` parameter
- Each prompt template is resolved using the `context_map` to get the actual prompt text
- All resolved prompts are combined into a single search query

### 2. Context Retrieval
- The combined prompt text is used as a search query for the RAG pipeline
- The system retrieves the top 3 most relevant document chunks based on semantic similarity
- Each chunk includes content, document name, and similarity score

### 3. Context Integration
- The retrieved chunks are formatted as context information
- Context is passed as secondary information to the LLM
- The LLM is instructed to use primary prompt information first, and reference context if relevant

## API Usage

### Request Format
```json
POST /template_engine/generate_doc/
{
    "template_id": "uuid-here",
    "context_map": {
        "name": "Alice Johnson",
        "company": "TechCorp"
    },
    "prompt_map": {
        "summary": "Write a professional summary about {{name}} who works at {{company}}",
        "background": "Provide background information for {{name}}"
    }
}
```

### Response
- Returns a `.docx` file with the generated document
- The document content will be enhanced with context from relevant database chunks

## Implementation Details

### Modified Files

1. **`template_engine/views.py`**
   - Updated `generate_document` view to extract prompts and retrieve context
   - Added RAG pipeline integration

2. **`template_engine/services/document_pipeline.py`**
   - Added `context_info` parameter to `process_lexical_document`
   - Passes context through to prompt resolution

3. **`template_engine/services/placeholder_resolver.py`**
   - Updated `resolve_llm_prompts` to accept and pass context information

4. **`template_engine/services/llm_client.py`**
   - Enhanced `call_llm` to include context as secondary information
   - Formats context with clear separation and instructions

### Context Format

The context is formatted as follows in the LLM prompt:

```
[Primary Prompt]

--- CONTEXT (Reference if needed) ---

Context 1 (from Document Name, relevance: 0.856):
[Chunk content here]

Context 2 (from Another Document, relevance: 0.743):
[Chunk content here]

Context 3 (from Third Document, relevance: 0.621):
[Chunk content here]

--- END CONTEXT ---

Please use the primary prompt information first, and reference the context above if it's relevant to your response.
```

## Benefits

1. **Enhanced Relevance**: Documents are generated with access to the most relevant information from your knowledge base
2. **Automatic Context**: No manual context selection required - the system finds relevant information automatically
3. **Semantic Search**: Uses advanced embedding-based similarity to find truly relevant content
4. **Non-Intrusive**: Context is provided as secondary information, so primary prompts remain the main driver
5. **Scalable**: Works with any number of documents in the RAG pipeline

## Testing

Run the test script to verify the integration:

```bash
python test_context_integration.py
```

This will test:
- Prompt extraction and resolution
- RAG pipeline initialization
- Context retrieval
- Context formatting
- LLM integration

## Requirements

- RAG pipeline must be set up with documents and embeddings
- OpenAI API key configured for embedding generation
- Documents must be processed through the RAG pipeline before context can be retrieved

## Error Handling

- If no relevant chunks are found, the system continues without context
- If RAG pipeline is unavailable, document generation continues with prompts only
- All errors are logged and returned as appropriate HTTP status codes 