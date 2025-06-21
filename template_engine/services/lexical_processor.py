def parse_lexical_json(lexical_json):
    """
    Parses Lexical JSON and returns a list of structured blocks.
    Each block is a tuple: (type, content[, metadata])
    """
    blocks = []

    def extract_text(children):
        return ''.join(child.get('text', '') for child in children)

    def walk_nodes(nodes):
        for node in nodes:
            node_type = node.get('type')
            children = node.get('children', [])

            if node_type == 'paragraph':
                text = extract_text(children)
                blocks.append(('paragraph', text))

            elif node_type == 'heading':
                level = node.get('level', 1)
                text = extract_text(children)
                blocks.append(('heading', text, level))

            elif node_type == 'quote':
                text = extract_text(children)
                blocks.append(('quote', text))

            elif node_type == 'list':
                list_type = node.get('listType', 'bullet')
                items = []
                for li in children:
                    if li.get('type') == 'listitem':
                        items.append(extract_text(li.get('children', [])))
                blocks.append(('list', items, list_type))

            else:
                # Walk unknown nodes recursively
                walk_nodes(children)

    walk_nodes(lexical_json.get('root', {}).get('children', []))
    return blocks
