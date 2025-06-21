"""
Text chunking service for breaking documents into smaller pieces for better embedding and retrieval
"""
from typing import List, Dict, Any, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter
import logging

logger = logging.getLogger(__name__)


class TextChunker:
    """
    Service for chunking text documents into smaller pieces for embedding
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize the text chunker
        
        Args:
            chunk_size: Maximum size of each chunk in characters
            chunk_overlap: Overlap between consecutive chunks in characters
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
    
    def chunk_text(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Split text into chunks with metadata
        
        Args:
            text: The text to chunk
            metadata: Additional metadata to include with each chunk
            
        Returns:
            List of chunk dictionaries with content and metadata
        """
        try:
            # Split the text into chunks
            chunks = self.text_splitter.split_text(text)
            
            # Create chunk objects with metadata
            chunk_objects = []
            for i, chunk_content in enumerate(chunks):
                chunk_obj = {
                    'content': chunk_content.strip(),
                    'chunk_index': i,
                    'metadata': metadata if metadata is not None else {}
                }
                chunk_objects.append(chunk_obj)
            
            logger.info(f"Created {len(chunk_objects)} chunks from text")
            return chunk_objects
            
        except Exception as e:
            logger.error(f"Error chunking text: {str(e)}")
            raise ValueError(f"Failed to chunk text: {str(e)}")
    
    def chunk_document(self, document_content: str, document_name: str, 
                      document_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Chunk a document with document-specific metadata
        
        Args:
            document_content: The document text content
            document_name: Name of the document
            document_id: ID of the document (optional)
            
        Returns:
            List of chunk dictionaries with content and metadata
        """
        metadata = {
            'document_name': document_name,
            'document_id': document_id if document_id is not None else '',
            'chunk_size': self.chunk_size,
            'chunk_overlap': self.chunk_overlap
        }
        
        return self.chunk_text(document_content, metadata) 