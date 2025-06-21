"""
RAG (Retrieval-Augmented Generation) pipeline service
"""
import os
import uuid
from typing import List, Dict, Any, Optional
import logging

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from .document_processor import DocumentProcessor
from .text_chunker import TextChunker
from .embedding_service import EmbeddingService
from ..models import Document, DocumentChunk

logger = logging.getLogger(__name__)


class RAGPipeline:
    """
    Main RAG pipeline service for processing documents and creating searchable chunks
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200, 
                 embedding_model: str = "text-embedding-3-small"):
        """
        Initialize the RAG pipeline
        
        Args:
            chunk_size: Maximum size of each chunk in characters
            chunk_overlap: Overlap between consecutive chunks in characters
            embedding_model: OpenAI embedding model to use
        """
        self.document_processor = DocumentProcessor()
        self.text_chunker = TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.embedding_service = EmbeddingService(model=embedding_model)
    
    def _validate_uuid(self, uuid_string: str) -> Optional[uuid.UUID]:
        """
        Validate and convert string to UUID
        
        Args:
            uuid_string: String representation of UUID
            
        Returns:
            UUID object if valid, None if invalid
        """
        if not uuid_string:
            return None
        try:
            return uuid.UUID(uuid_string)
        except ValueError:
            logger.error(f"Invalid UUID format: {uuid_string}")
            return None
    
    def process_text_document(self, name: str, content: str, template_id: str = None, session_id: str = None) -> Document:
        """
        Process a text document and store it in the database
        
        Args:
            name: Name of the document
            content: Text content
            template_id: Optional template ID to associate with
            session_id: Optional session ID for cleanup
            
        Returns:
            Created Document object
        """
        try:
            # Validate template_id if provided
            validated_template_id = self._validate_uuid(template_id) if template_id else None
            
            # Create document record
            document = Document.objects.create(
                name=name,
                content=content,
                file_type='text',
                template_id=validated_template_id,
                session_id=session_id
            )
            
            # Process the document
            self._process_document(document)
            
            logger.info(f"Successfully processed text document: {name}")
            return document
            
        except Exception as e:
            logger.error(f"Error processing text document {name}: {str(e)}")
            raise
    
    def process_file_document(self, name: str, file_obj, template_id: str = None, session_id: str = None) -> Document:
        """
        Process a file document (PDF, DOCX) and store it in the database
        
        Args:
            name: Name of the document
            file_obj: Uploaded file object
            template_id: Optional template ID to associate with
            session_id: Optional session ID for cleanup
            
        Returns:
            Created Document object
        """
        try:
            # Validate template_id if provided
            validated_template_id = self._validate_uuid(template_id) if template_id else None
            
            # Determine file type
            file_type = self.document_processor.validate_file_type(file_obj.name)
            
            # Save file to storage
            file_path = f"uploads/{uuid.uuid4()}_{file_obj.name}"
            saved_path = default_storage.save(file_path, ContentFile(file_obj.read()))
            
            # Create document record
            document = Document.objects.create(
                name=name,
                file_path=saved_path,
                file_type=file_type,
                template_id=validated_template_id,
                session_id=session_id
            )
            
            # Process the document
            self._process_document(document)
            
            logger.info(f"Successfully processed file document: {name}")
            return document
            
        except Exception as e:
            logger.error(f"Error processing file document {name}: {str(e)}")
            raise
    
    def _process_document(self, document: Document) -> None:
        """
        Internal method to process a document: extract text, chunk, and embed
        
        Args:
            document: Document object to process
        """
        try:
            # Extract text content
            if document.file_type == 'text':
                text_content = document.content
            else:
                # Get full path for file processing
                file_path = default_storage.path(document.file_path) if document.file_path else None
                text_content = self.document_processor.process_document(
                    file_path=file_path,
                    file_type=document.file_type
                )
            
            # Update document with extracted content
            document.content = text_content
            document.save()
            
            # Chunk the text
            chunks_data = self.text_chunker.chunk_document(
                document_content=text_content,
                document_name=document.name,
                document_id=str(document.id)
            )
            
            # Generate embeddings for chunks
            chunks_with_embeddings = self.embedding_service.embed_chunks(chunks_data)
            
            # Save chunks to database
            self._save_chunks_to_db(document, chunks_with_embeddings)
            
            logger.info(f"Processed document {document.name} into {len(chunks_with_embeddings)} chunks")
            
        except Exception as e:
            logger.error(f"Error in document processing pipeline: {str(e)}")
            raise
    
    def _save_chunks_to_db(self, document: Document, chunks_data: List[Dict[str, Any]]) -> None:
        """
        Save processed chunks to the database
        
        Args:
            document: Document object
            chunks_data: List of chunk dictionaries with content and embeddings
        """
        try:
            # Delete existing chunks for this document
            DocumentChunk.objects.filter(document=document).delete()
            
            # Create new chunks
            chunks_to_create = []
            for chunk_data in chunks_data:
                chunk = DocumentChunk(
                    document=document,
                    content=chunk_data['content'],
                    chunk_index=chunk_data['chunk_index'],
                    embedding=chunk_data['embedding'],
                    metadata=chunk_data['metadata']
                )
                chunks_to_create.append(chunk)
            
            # Bulk create chunks
            DocumentChunk.objects.bulk_create(chunks_to_create)
            
            logger.info(f"Saved {len(chunks_to_create)} chunks to database for document {document.name}")
            
        except Exception as e:
            logger.error(f"Error saving chunks to database: {str(e)}")
            raise
    
    def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        """
        Get all chunks for a specific document
        
        Args:
            document_id: ID of the document
            
        Returns:
            List of chunks for the document
        """
        try:
            chunks = DocumentChunk.objects.filter(document_id=document_id).order_by('chunk_index')
            
            results = []
            for chunk in chunks:
                result = {
                    'chunk_id': str(chunk.id),
                    'content': chunk.content,
                    'chunk_index': chunk.chunk_index,
                    'metadata': chunk.metadata,
                    'has_embedding': chunk.embedding is not None
                }
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting document chunks: {str(e)}")
            return []
    
    def get_similar_chunks_internal(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Internal method to get similar chunks for use in other services
        This is not exposed via API
        
        Args:
            query: Search query
            top_k: Number of top results to return
            
        Returns:
            List of similar chunks with metadata
        """
        try:
            # Generate embedding for query
            query_embedding = self.embedding_service.generate_embedding(query)
            
            # Get all chunks from database
            all_chunks = DocumentChunk.objects.all()
            
            if not all_chunks:
                return []
            
            # Calculate similarities
            similarities = []
            for chunk in all_chunks:
                if chunk.embedding:
                    similarity = self.embedding_service.cosine_similarity(
                        query_embedding, chunk.embedding
                    )
                    similarities.append((chunk, similarity))
            
            # Sort by similarity and get top results
            similarities.sort(key=lambda x: x[1], reverse=True)
            top_results = similarities[:top_k]
            
            # Format results
            results = []
            for chunk, similarity in top_results:
                result = {
                    'chunk_id': str(chunk.id),
                    'content': chunk.content,
                    'similarity_score': similarity,
                    'document_name': chunk.document.name,
                    'document_id': str(chunk.document.id),
                    'chunk_index': chunk.chunk_index,
                    'metadata': chunk.metadata
                }
                results.append(result)
            
            logger.info(f"Found {len(results)} similar chunks for internal query")
            return results
            
        except Exception as e:
            logger.error(f"Error getting similar chunks internally: {str(e)}")
            return [] 