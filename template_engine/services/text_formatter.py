"""
Text formatting utilities for document generation.
Provides flexible formatting capabilities for different text styles and formats.
"""

from typing import List, Dict, Any, Union, Optional
import re

class TextFormatter:
    """
    Utility class for handling text formatting operations.
    """
    
    @staticmethod
    def apply_font_styling(text: str, font_name: Optional[str] = None, font_size: Optional[int] = None, 
                          font_color: Optional[str] = None) -> Dict[str, Any]:
        """
        Apply font styling to text.
        
        Args:
            text: The text to format
            font_name: Font family name (e.g., 'Arial', 'Times New Roman')
            font_size: Font size in points
            font_color: Font color (hex string or color name)
            
        Returns:
            Dictionary with formatting information
        """
        formatting = {}
        
        if font_name:
            formatting['font_name'] = font_name
        if font_size:
            formatting['font_size'] = font_size
        if font_color:
            formatting['font_color'] = font_color
            
        return {
            'text': text,
            'format': formatting
        }
    
    @staticmethod
    def apply_text_effects(text: str, bold: bool = False, italic: bool = False,
                          underline: bool = False, strikethrough: bool = False,
                          subscript: bool = False, superscript: bool = False) -> Dict[str, Any]:
        """
        Apply text effects to text.
        
        Args:
            text: The text to format
            bold: Make text bold
            italic: Make text italic
            underline: Underline text
            strikethrough: Strikethrough text
            subscript: Make text subscript
            superscript: Make text superscript
            
        Returns:
            Dictionary with formatting information
        """
        formatting = {
            'bold': bold,
            'italic': italic,
            'underline': underline,
            'strikethrough': strikethrough,
            'subscript': subscript,
            'superscript': superscript
        }
        
        return {
            'text': text,
            'format': formatting
        }
    
    @staticmethod
    def create_link(text: str, url: str) -> Dict[str, Any]:
        """
        Create a hyperlink.
        
        Args:
            text: The link text
            url: The URL to link to
            
        Returns:
            Dictionary with link formatting
        """
        return {
            'text': text,
            'format': {'link': url}
        }
    
    @staticmethod
    def create_code_block(text: str, language: str = '') -> Dict[str, Any]:
        """
        Create a code block with monospace formatting.
        
        Args:
            text: The code text
            language: Programming language (optional)
            
        Returns:
            Dictionary with code formatting
        """
        return {
            'text': text,
            'format': {
                'code': True,
                'font_name': 'Courier New',
                'font_size': 10,
                'language': language
            }
        }
    
    @staticmethod
    def merge_formatted_segments(segments: List[Dict[str, Any]]) -> str:
        """
        Merge formatted segments into plain text.
        
        Args:
            segments: List of formatted text segments
            
        Returns:
            Plain text string
        """
        return ''.join(segment['text'] for segment in segments)
    
    @staticmethod
    def extract_plain_text_from_blocks(blocks: List[tuple]) -> str:
        """
        Extract plain text from blocks, ignoring formatting.
        
        Args:
            blocks: List of document blocks
            
        Returns:
            Plain text string
        """
        text_parts = []
        
        for block in blocks:
            block_type = block[0]
            content = block[1]
            
            if isinstance(content, str):
                text_parts.append(content)
            elif isinstance(content, list):
                # Handle formatted segments
                for segment in content:
                    if isinstance(segment, dict) and 'text' in segment:
                        text_parts.append(segment['text'])
                    elif isinstance(segment, str):
                        text_parts.append(segment)
            elif isinstance(content, list) and all(isinstance(item, str) for item in content):
                # Handle list items
                text_parts.extend(content)
                
        return ' '.join(text_parts)
    
    @staticmethod
    def apply_conditional_formatting(text: str, condition: bool, 
                                   true_format: Dict[str, Any], 
                                   false_format: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Apply conditional formatting based on a condition.
        
        Args:
            text: The text to format
            condition: Boolean condition
            true_format: Format to apply if condition is True
            false_format: Format to apply if condition is False (optional)
            
        Returns:
            Dictionary with conditional formatting
        """
        if condition:
            return {
                'text': text,
                'format': true_format
            }
        elif false_format:
            return {
                'text': text,
                'format': false_format
            }
        else:
            return {
                'text': text,
                'format': {}
            }
    
    @staticmethod
    def create_highlighted_text(text: str, highlight_color: str = '#FFFF00') -> Dict[str, Any]:
        """
        Create highlighted text.
        
        Args:
            text: The text to highlight
            highlight_color: Highlight color (hex string)
            
        Returns:
            Dictionary with highlight formatting
        """
        return {
            'text': text,
            'format': {
                'highlight': True,
                'highlight_color': highlight_color
            }
        }
    
    @staticmethod
    def create_emphasized_text(text: str, emphasis_type: str = 'bold') -> Dict[str, Any]:
        """
        Create emphasized text with common emphasis patterns.
        
        Args:
            text: The text to emphasize
            emphasis_type: Type of emphasis ('bold', 'italic', 'underline', 'highlight')
            
        Returns:
            Dictionary with emphasis formatting
        """
        emphasis_map = {
            'bold': {'bold': True},
            'italic': {'italic': True},
            'underline': {'underline': True},
            'highlight': {'highlight': True, 'highlight_color': '#FFFF00'},
            'strong': {'bold': True},
            'em': {'italic': True}
        }
        
        return {
            'text': text,
            'format': emphasis_map.get(emphasis_type, {})
        } 