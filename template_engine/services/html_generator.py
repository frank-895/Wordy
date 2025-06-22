"""
HTML generator for converting Lexical blocks to HTML with styling.
This replaces the DOCX generator with a more flexible HTML-based approach.
"""

import html
from typing import List, Dict, Any

def build_html(blocks: List[tuple]) -> str:
    """
    Builds HTML from structured blocks with formatting support.
    
    Args:
        blocks: List of tuples (block_type, content[, metadata])
        
    Returns:
        Complete HTML document as string
    """
    html_parts = []
    
    # Start HTML document
    html_parts.append('<!DOCTYPE html>')
    html_parts.append('<html lang="en">')
    html_parts.append('<head>')
    html_parts.append('<meta charset="UTF-8">')
    html_parts.append('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
    html_parts.append('<title>Generated Document</title>')
    html_parts.append('<style>')
    html_parts.append(get_css_styles())
    html_parts.append('</style>')
    html_parts.append('</head>')
    html_parts.append('<body>')
    
    # Generate content
    for block in blocks:
        html_parts.append(process_block(block))
    
    # Close HTML document
    html_parts.append('</body>')
    html_parts.append('</html>')
    
    return '\n'.join(html_parts)

def get_css_styles() -> str:
    """
    Returns CSS styles for the document.
    """
    return """
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000000;
            margin: 0;
            padding: 0;
        }
        
        h1 {
            font-size: 24pt;
            font-weight: bold;
            margin-top: 24pt;
            margin-bottom: 12pt;
            color: #000000;
        }
        
        h2 {
            font-size: 18pt;
            font-weight: bold;
            margin-top: 18pt;
            margin-bottom: 9pt;
            color: #000000;
        }
        
        h3 {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 14pt;
            margin-bottom: 7pt;
            color: #000000;
        }
        
        p {
            margin-top: 0;
            margin-bottom: 12pt;
            text-align: justify;
        }
        
        .quote {
            font-style: italic;
            margin-left: 0.5in;
            margin-right: 0.5in;
            padding-left: 0.25in;
            border-left: 3px solid #cccccc;
        }
        
        .code {
            font-family: 'Courier New', 'Monaco', monospace;
            font-size: 10pt;
            background-color: #f5f5f5;
            padding: 8pt;
            border: 1px solid #dddddd;
            border-radius: 4px;
            white-space: pre-wrap;
            margin: 12pt 0;
        }
        
        .list-bullet {
            list-style-type: disc;
            margin-left: 0.5in;
        }
        
        .list-number {
            list-style-type: decimal;
            margin-left: 0.5in;
        }
        
        .list-item {
            margin-bottom: 6pt;
        }
        
        .bold {
            font-weight: bold;
        }
        
        .italic {
            font-style: italic;
        }
        
        .underline {
            text-decoration: underline;
        }
        
        .strikethrough {
            text-decoration: line-through;
        }
        
        .subscript {
            vertical-align: sub;
            font-size: 0.8em;
        }
        
        .superscript {
            vertical-align: super;
            font-size: 0.8em;
        }
        
        .link {
            color: #0066cc;
            text-decoration: underline;
        }
        
        .highlight {
            background-color: #ffff00;
        }
        
        @page {
            size: A4;
            margin: 0.75in;
        }
    """

def process_block(block: tuple) -> str:
    """
    Process a single block and return HTML.
    
    Args:
        block: Tuple (block_type, content[, metadata])
        
    Returns:
        HTML string for the block
    """
    block_type = block[0]
    content = block[1]
    
    if block_type == 'heading':
        level = block[2] if len(block) > 2 else 1
        if isinstance(content, str):
            return f'<h{level}>{html.escape(content)}</h{level}>'
        else:
            return f'<h{level}>{process_formatted_content(content)}</h{level}>'
    
    elif block_type == 'paragraph':
        if isinstance(content, str):
            return f'<p>{html.escape(content)}</p>'
        else:
            return f'<p>{process_formatted_content(content)}</p>'
    
    elif block_type == 'quote':
        if isinstance(content, str):
            return f'<div class="quote"><p>{html.escape(content)}</p></div>'
        else:
            return f'<div class="quote"><p>{process_formatted_content(content)}</p></div>'
    
    elif block_type == 'code':
        text, language = content, block[2] if len(block) > 2 else ''
        return f'<div class="code">{html.escape(text)}</div>'
    
    elif block_type == 'list':
        items, list_type = content, block[2]
        list_class = 'list-bullet' if list_type == 'bullet' else 'list-number'
        
        html_parts = [f'<ul class="{list_class}">' if list_type == 'bullet' else f'<ol class="{list_class}">']
        
        for item in items:
            if isinstance(item, str):
                html_parts.append(f'<li class="list-item">{html.escape(item)}</li>')
            else:
                html_parts.append(f'<li class="list-item">{process_formatted_content(item)}</li>')
        
        html_parts.append('</ul>' if list_type == 'bullet' else '</ol>')
        return '\n'.join(html_parts)
    
    else:
        return f'<p>[Unsupported block type: {block_type}]</p>'

def process_formatted_content(formatted_segments: List[Dict[str, Any]]) -> str:
    """
    Process formatted text segments and return HTML with inline styles.
    
    Args:
        formatted_segments: List of dictionaries with 'text' and 'format' keys
        
    Returns:
        HTML string with inline styles
    """
    html_parts = []
    
    for segment in formatted_segments:
        text = segment['text']
        formatting = segment['format']
        
        if text == '':
            continue
        
        # Build CSS classes for formatting
        css_classes = []
        
        if formatting.get('bold'):
            css_classes.append('bold')
        if formatting.get('italic'):
            css_classes.append('italic')
        if formatting.get('underline'):
            css_classes.append('underline')
        if formatting.get('strikethrough'):
            css_classes.append('strikethrough')
        if formatting.get('subscript'):
            css_classes.append('subscript')
        if formatting.get('superscript'):
            css_classes.append('superscript')
        if formatting.get('highlight'):
            css_classes.append('highlight')
        if 'link' in formatting:
            css_classes.append('link')
        
        # Build inline styles for font properties
        inline_styles = []
        
        if formatting.get('font_name'):
            inline_styles.append(f"font-family: '{formatting['font_name']}', sans-serif")
        
        if formatting.get('font_size'):
            font_size = formatting['font_size']
            # Convert px to pt if needed (1pt ≈ 1.33px)
            if font_size.endswith('px'):
                try:
                    px_value = float(font_size[:-2])
                    pt_value = px_value * 0.75  # Convert px to pt
                    inline_styles.append(f"font-size: {pt_value:.1f}pt")
                except ValueError:
                    inline_styles.append(f"font-size: {font_size}")
            else:
                inline_styles.append(f"font-size: {font_size}")
        
        if formatting.get('font_color'):
            color = formatting['font_color']
            if color.startswith('#'):
                inline_styles.append(f"color: {color}")
            else:
                inline_styles.append(f"color: {color}")
        
        # Combine classes and styles
        attributes = []
        if css_classes:
            attributes.append(f'class="{" ".join(css_classes)}"')
        if inline_styles:
            attributes.append(f'style="{"; ".join(inline_styles)}"')
        
        # Create the HTML element
        if 'link' in formatting:
            url = formatting['link']
            attr_str = ' '.join(attributes)
            html_parts.append(f'<a href="{html.escape(url)}" {attr_str}>{html.escape(text)}</a>')
        else:
            if attributes:
                attr_str = ' '.join(attributes)
                html_parts.append(f'<span {attr_str}>{html.escape(text)}</span>')
            else:
                html_parts.append(html.escape(text))
    
    return ''.join(html_parts) 