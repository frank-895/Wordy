def parse_lexical_json(lexical_json):
    blocks = []
    for node in lexical_json.get('root', {}).get('children', []):
        if node['type'] == 'paragraph':
            text = ''.join(child.get('text', '') for child in node['children'])
            blocks.append(('paragraph', text))
        elif node['type'] == 'heading':
            level = node.get('level', 1)
            text = ''.join(child.get('text', '') for child in node['children'])
            blocks.append(('heading', text, level))
    return blocks