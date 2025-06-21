"""
Embedding service for generating vector embeddings using OpenAI API
"""
import os
import openai
from typing import List, Dict, Any, Optional
import logging
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Service for generating embeddings using OpenAI API
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "text-embedding-3-small"):
        """
        Initialize the embedding service
        
        Args:
            api_key: OpenAI API key (if not provided, will use environment variable)
            model: OpenAI embedding model to use
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass api_key parameter.")
        
        self.model = model
        self.client = openai.OpenAI(api_key=self.api_key)
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            logger.info(f"🔍 RAG DEBUG: Generating embedding for text: '{text[:100]}...'")
            response = self.client.embeddings.create(
                model=self.model,
                input=text
            )
            embedding = response.data[0].embedding
            logger.info(f"🔍 RAG DEBUG: Generated embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"🔍 RAG DEBUG: Error generating embedding: {str(e)}")
            raise ValueError(f"Failed to generate embedding: {str(e)}")
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts in a batch
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        try:
            logger.info(f"🔍 RAG DEBUG: Generating batch embeddings for {len(texts)} texts")
            response = self.client.embeddings.create(
                model=self.model,
                input=texts
            )
            embeddings = [data.embedding for data in response.data]
            logger.info(f"🔍 RAG DEBUG: Generated {len(embeddings)} embeddings with {len(embeddings[0]) if embeddings else 0} dimensions each")
            return embeddings
            
        except Exception as e:
            logger.error(f"🔍 RAG DEBUG: Error generating batch embeddings: {str(e)}")
            raise ValueError(f"Failed to generate batch embeddings: {str(e)}")
    
    def embed_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate embeddings for a list of text chunks
        
        Args:
            chunks: List of chunk dictionaries with 'content' key
            
        Returns:
            List of chunk dictionaries with added 'embedding' key
        """
        try:
            # Extract text content from chunks
            texts = [chunk['content'] for chunk in chunks]
            
            # Generate embeddings in batch
            embeddings = self.generate_embeddings_batch(texts)
            
            # Add embeddings to chunks
            for i, chunk in enumerate(chunks):
                chunk['embedding'] = embeddings[i]
            
            logger.info(f"Generated embeddings for {len(chunks)} chunks")
            return chunks
            
        except Exception as e:
            logger.error(f"Error embedding chunks: {str(e)}")
            raise ValueError(f"Failed to embed chunks: {str(e)}")
    
    def cosine_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score between 0 and 1
        """
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return dot_product / (norm1 * norm2)
            
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {str(e)}")
            return 0.0
    
    def find_similar_chunks(self, query_embedding: List[float], 
                          chunk_embeddings: List[List[float]], 
                          top_k: int = 5) -> List[tuple]:
        """
        Find the most similar chunks to a query embedding
        
        Args:
            query_embedding: Query embedding vector
            chunk_embeddings: List of chunk embedding vectors
            top_k: Number of top similar chunks to return
            
        Returns:
            List of tuples (index, similarity_score) sorted by similarity
        """
        try:
            similarities = []
            for i, chunk_embedding in enumerate(chunk_embeddings):
                similarity = self.cosine_similarity(query_embedding, chunk_embedding)
                similarities.append((i, similarity))
            
            # Sort by similarity score (descending)
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            return similarities[:top_k]
            
        except Exception as e:
            logger.error(f"Error finding similar chunks: {str(e)}")
            return [] 