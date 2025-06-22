def parse_lexical_json(lexical_json):
    """
    Parses Lexical JSON and returns a list of structured blocks with formatting.
    Each block is a tuple: (type, content[, metadata])
    Content can be either a string (for simple blocks) or a list of formatted text segments.
    """
    blocks = []

    def extract_formatted_text(children):
        """
        Extracts text with formatting information from children nodes.
        Returns a list of dictionaries with 'text' and 'format' keys.
        """
        formatted_segments = []
        
        for child in children:
            if child.get('type') == 'text':
                text = child.get('text', '')
                format_info = child.get('format', 0)
                style = child.get('style', '')
                
                # Extract individual format flags
                formatting = {
                    'bold': bool(format_info & 1),  # 1 = BOLD
                    'italic': bool(format_info & 2),  # 2 = ITALIC
                    'underline': bool(format_info & 4),  # 4 = UNDERLINE
                    'strikethrough': bool(format_info & 8),  # 8 = STRIKETHROUGH
                    'underlineStrikethrough': bool(format_info & 12),  # 12 = UNDERLINE + STRIKETHROUGH
                    'code': bool(format_info & 16),  # 16 = CODE
                    'subscript': bool(format_info & 32),  # 32 = SUBSCRIPT
                    'superscript': bool(format_info & 64),  # 64 = SUPERSCRIPT
                }
                
                # Extract font properties from style string
                if style:
                    # Parse CSS-like style string
                    style_parts = style.split(';')
                    for part in style_parts:
                        part = part.strip()
                        if ':' in part:
                            property_name, value = part.split(':', 1)
                            property_name = property_name.strip()
                            value = value.strip()
                            
                            if property_name == 'font-family':
                                formatting['font_name'] = value.strip("'\"")
                            elif property_name == 'font-size':
                                formatting['font_size'] = value
                            elif property_name == 'color':
                                formatting['font_color'] = value
                            elif property_name == 'background-color':
                                formatting['background_color'] = value
                
                formatted_segments.append({
                    'text': text,
                    'format': formatting
                })
            elif child.get('type') == 'variable':
                # Handle variable nodes - extract the text content
                text = child.get('text', '')
                variable_id = child.get('variableId', '')
                format_info = child.get('format', 0)
                style = child.get('style', '')
                
                # Extract individual format flags
                formatting = {
                    'bold': bool(format_info & 1),  # 1 = BOLD
                    'italic': bool(format_info & 2),  # 2 = ITALIC
                    'underline': bool(format_info & 4),  # 4 = UNDERLINE
                    'strikethrough': bool(format_info & 8),  # 8 = STRIKETHROUGH
                    'underlineStrikethrough': bool(format_info & 12),  # 12 = UNDERLINE + STRIKETHROUGH
                    'code': bool(format_info & 16),  # 16 = CODE
                    'subscript': bool(format_info & 32),  # 32 = SUBSCRIPT
                    'superscript': bool(format_info & 64),  # 64 = SUPERSCRIPT
                    'variable_id': variable_id,  # Store variable ID for later processing
                }
                
                # Extract font properties from style string
                if style:
                    # Parse CSS-like style string
                    style_parts = style.split(';')
                    for part in style_parts:
                        part = part.strip()
                        if ':' in part:
                            property_name, value = part.split(':', 1)
                            property_name = property_name.strip()
                            value = value.strip()
                            
                            if property_name == 'font-family':
                                formatting['font_name'] = value.strip("'\"")
                            elif property_name == 'font-size':
                                formatting['font_size'] = value
                            elif property_name == 'color':
                                formatting['font_color'] = value
                            elif property_name == 'background-color':
                                formatting['background_color'] = value
                
                formatted_segments.append({
                    'text': text,
                    'format': formatting
                })
            elif child.get('type') == 'link':
                # Handle links
                url = child.get('url', '')
                link_children = child.get('children', [])
                link_text = ''.join(grandchild.get('text', '') for grandchild in link_children)
                formatted_segments.append({
                    'text': link_text,
                    'format': {'link': url}
                })
            else:
                # Recursively process other node types
                formatted_segments.extend(extract_formatted_text(child.get('children', [])))
        
        return formatted_segments

    def walk_nodes(nodes):
        for node in nodes:
            node_type = node.get('type')
            children = node.get('children', [])

            if node_type == 'paragraph':
                formatted_text = extract_formatted_text(children)
                # If all segments have no formatting, simplify to plain text
                if all(not any(seg['format'].values()) for seg in formatted_text):
                    text = ''.join(seg['text'] for seg in formatted_text)
                    blocks.append(('paragraph', text))
                else:
                    blocks.append(('paragraph', formatted_text))

            elif node_type == 'heading':
                level = node.get('level', 1)
                formatted_text = extract_formatted_text(children)
                # If all segments have no formatting, simplify to plain text
                if all(not any(seg['format'].values()) for seg in formatted_text):
                    text = ''.join(seg['text'] for seg in formatted_text)
                    blocks.append(('heading', text, level))
                else:
                    blocks.append(('heading', formatted_text, level))

            elif node_type == 'quote':
                formatted_text = extract_formatted_text(children)
                if all(not any(seg['format'].values()) for seg in formatted_text):
                    text = ''.join(seg['text'] for seg in formatted_text)
                    blocks.append(('quote', text))
                else:
                    blocks.append(('quote', formatted_text))

            elif node_type == 'code':
                language = node.get('language', '')
                formatted_text = extract_formatted_text(children)
                text = ''.join(seg['text'] for seg in formatted_text)
                blocks.append(('code', text, language))

            elif node_type == 'list':
                list_type = node.get('listType', 'bullet')
                items = []
                for li in children:
                    if li.get('type') == 'listitem':
                        li_formatted_text = extract_formatted_text(li.get('children', []))
                        # Simplify list items to plain text for now
                        item_text = ''.join(seg['text'] for seg in li_formatted_text)
                        items.append(item_text)
                blocks.append(('list', items, list_type))

            else:
                # Walk unknown nodes recursively
                walk_nodes(children)

    walk_nodes(lexical_json.get('root', {}).get('children', []))
    return blocks
