import { useCallback, useEffect, useState } from 'react';
import { 
  $createParagraphNode, 
  $createTextNode,
  $getRoot, 
  $getSelection, 
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { 
  $createHeadingNode, 
  $createQuoteNode, 
  $isHeadingNode, 
  $isQuoteNode, 
  HeadingNode, 
  QuoteNode
} from '@lexical/rich-text';
import type { HeadingTagType } from '@lexical/rich-text';
import { 
  $isListNode, 
  $isListItemNode, 
  ListNode, 
  ListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from '@lexical/list';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { 
  $getSelectionStyleValueForProperty,
  $patchStyleText
} from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import type { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';

// Font options
const FONT_FAMILY_OPTIONS: [string, string][] = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New, monospace'],
  ['Georgia', 'Georgia, serif'],
  ['Times New Roman', 'Times New Roman, serif'],
  ['Trebuchet MS', 'Trebuchet MS, sans-serif'],
  ['Verdana', 'Verdana, sans-serif'],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];

// Custom theme for styling
const theme = {
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-gray-100 px-1 py-0.5 rounded text-sm font-mono',
  },
  paragraph: 'mb-2',
  heading: {
    h1: 'text-3xl font-bold mb-4 mt-6',
    h2: 'text-2xl font-bold mb-3 mt-5',
    h3: 'text-xl font-bold mb-2 mt-4',
    h4: 'text-lg font-bold mb-2 mt-3',
    h5: 'text-base font-bold mb-1 mt-2',
    h6: 'text-sm font-bold mb-1 mt-2',
  },
  quote: 'border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-4',
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal list-inside mb-2',
    ul: 'list-disc list-inside mb-2',
    listitem: 'mb-1',
  },
};

// Toolbar button component
function ToolbarButton({ 
  onClick, 
  disabled = false, 
  active = false, 
  children, 
  title 
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`
        px-2 py-1 text-sm border border-gray-300 
        ${active 
          ? 'bg-blue-100 text-blue-700 border-blue-300' 
          : 'bg-white text-gray-700 hover:bg-gray-50'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        first:rounded-l last:rounded-r border-r-0 last:border-r
      `}
    >
      {children}
    </button>
  );
}

// Dropdown component
function ToolbarDropdown({
  value,
  onChange,
  options,
  disabled = false
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {options.map(([option, text]) => (
        <option key={option} value={option}>
          {text}
        </option>
      ))}
    </select>
  );
}

// Color picker component
function ColorPicker({
  value,
  onChange,
  disabled = false
}: {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-8 h-8 border border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

// Main toolbar plugin
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] = useState('paragraph');
  const [fontSize, setFontSize] = useState('15px');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontColor, setFontColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      // Update block type
      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType(anchorNode, ListNode);
        const type = parentList ? parentList.getListType() : element.getListType();
        setBlockType(type);
      } else {
        const type = $isHeadingNode(element) ? element.getTag() : element.getType();
        setBlockType(type);
      }

      // Update font family
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );

      // Update font size
      setFontSize(
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );

      // Update font color
      setFontColor(
        $getSelectionStyleValueForProperty(selection, 'color', '#000000'),
      );

      // Update background color
      setBgColor(
        $getSelectionStyleValueForProperty(selection, 'background-color', '#ffffff'),
      );
    }
  }, [activeEditor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        $updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      1,
    );
  }, [editor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      activeEditor.registerUpdateListener(({editorState}) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      activeEditor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        1,
      ),
      activeEditor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        1,
      ),
    );
  }, [$updateToolbar, activeEditor]);

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [activeEditor],
  );

  const onFontColorSelect = useCallback(
    (value: string) => {
      applyStyleText({color: value});
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string) => {
      applyStyleText({'background-color': value});
    },
    [applyStyleText],
  );

  const onFontFamilySelect = useCallback(
    (value: string) => {
      applyStyleText({'font-family': value});
    },
    [applyStyleText],
  );

  const onFontSizeSelect = useCallback(
    (value: string) => {
      applyStyleText({'font-size': value});
    },
    [applyStyleText],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white border-b border-gray-200">
      {/* Undo/Redo */}
      <div className="flex">
        <ToolbarButton
          disabled={!canUndo}
          onClick={() => activeEditor.dispatchCommand(UNDO_COMMAND, undefined)}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          disabled={!canRedo}
          onClick={() => activeEditor.dispatchCommand(REDO_COMMAND, undefined)}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Block Type */}
      <ToolbarDropdown
        value={blockType}
        onChange={(value) => {
          if (value === 'paragraph') formatParagraph();
          else if (value === 'h1') formatHeading('h1');
          else if (value === 'h2') formatHeading('h2');
          else if (value === 'h3') formatHeading('h3');
          else if (value === 'h4') formatHeading('h4');
          else if (value === 'h5') formatHeading('h5');
          else if (value === 'h6') formatHeading('h6');
          else if (value === 'quote') formatQuote();
        }}
        options={[
          ['paragraph', 'Normal'],
          ['h1', 'Heading 1'],
          ['h2', 'Heading 2'],
          ['h3', 'Heading 3'],
          ['h4', 'Heading 4'],
          ['h5', 'Heading 5'],
          ['h6', 'Heading 6'],
          ['quote', 'Quote'],
        ]}
      />

      <div className="w-px h-6 bg-gray-300" />

      {/* Font Family */}
      <ToolbarDropdown
        value={fontFamily}
        onChange={onFontFamilySelect}
        options={FONT_FAMILY_OPTIONS}
      />

      {/* Font Size */}
      <ToolbarDropdown
        value={fontSize}
        onChange={onFontSizeSelect}
        options={FONT_SIZE_OPTIONS}
      />

      <div className="w-px h-6 bg-gray-300" />

      {/* Text Formatting */}
      <div className="flex">
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          active={isBold}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          active={isItalic}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          active={isUnderline}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
          active={isStrikethrough}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
          active={isCode}
          title="Code"
        >
          {'<>'}
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Colors */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-600">A</span>
        <ColorPicker value={fontColor} onChange={onFontColorSelect} />
        <span className="text-sm text-gray-600">⬛</span>
        <ColorPicker value={bgColor} onChange={onBgColorSelect} />
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Alignment */}
      <div className="flex">
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
          title="Align Left"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
          title="Align Center"
        >
          ≈
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
          title="Align Right"
        >
          ≣
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
          title="Justify"
        >
          ≡
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Lists */}
      <div className="flex">
        <ToolbarButton
          onClick={formatBulletList}
          active={blockType === 'bullet'}
          title="Bullet List"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          onClick={formatNumberedList}
          active={blockType === 'number'}
          title="Numbered List"
        >
          1.
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300" />

      {/* Indent */}
      <div className="flex">
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
          title="Outdent"
        >
          ⇤
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
          title="Indent"
        >
          ⇥
        </ToolbarButton>
      </div>
    </div>
  );
}

// Helper functions
function $findMatchingParent(
  node: any,
  findFn: (node: any) => boolean,
): any | null {
  let curr = node;

  while (curr !== null && curr.getParent() !== null && !findFn(curr)) {
    curr = curr.getParent();
  }

  return findFn(curr) ? curr : null;
}

function $isRootOrShadowRoot(node: any): boolean {
  return node.getKey() === 'root' || node.constructor.name === 'ShadowRoot';
}

function $getNearestNodeOfType(
  node: any,
  klass: any,
): any | null {
  let parent = node;

  while (parent != null) {
    if (parent instanceof klass) {
      return parent;
    }

    parent = parent.getParent();
  }

  return null;
}

function $setBlocksType(selection: any, createElement: () => any): void {
  const nodes = selection.getNodes();

  if (nodes.length === 0) {
    return;
  }

  const firstNode = nodes[0];
  const topLevelElement = firstNode.getTopLevelElement();

  if (topLevelElement === null) {
    return;
  }

  const newElement = createElement();
  topLevelElement.replace(newElement, true);
}

// Function to convert Lexical editor state to our custom format
function convertEditorStateToCustomFormat(editorState: EditorState) {
  interface TextNode {
    type: string;
    text: string;
    format?: number;
    style?: string;
  }

  interface ChildNode {
    type: string;
    level?: number;
    listType?: string;
    children: Array<TextNode>;
  }
  
  const lexicalJson = { root: { children: [] as ChildNode[] } };
  const contextMap: Record<string, string> = {};
  const promptMap: Record<string, string> = {};

  // Helper function to extract text nodes with their formatting
  const extractTextNodes = (node: any): TextNode[] => {
    const textNodes: TextNode[] = [];
    const children = node.getChildren();
    
    for (const child of children) {
      if (child.getType() === 'text') {
        const textNode: TextNode = {
          type: 'text',
          text: child.getTextContent()
        };
        
        // Add format information if present
        const format = child.getFormat();
        if (format > 0) {
          textNode.format = format;
        }
        
        // Add style information if present
        const style = child.getStyle();
        if (style) {
          textNode.style = style;
        }
        
        textNodes.push(textNode);
      } else {
        // For nested elements, recursively extract text nodes
        textNodes.push(...extractTextNodes(child));
      }
    }
    
    return textNodes;
  };

  editorState.read(() => {
    const root = $getRoot();
    const children = root.getChildren();

    for (const node of children) {
      if ($isHeadingNode(node)) {
        const textContent = node.getTextContent();
        const level = Number.parseInt(node.getTag().replace('h', ''), 10);
        const textNodes = extractTextNodes(node);
        
        lexicalJson.root.children.push({
          type: 'heading',
          level: level,
          children: textNodes.length > 0 ? textNodes : [{ type: 'text', text: textContent }]
        });

        // Extract variables from text content
        extractVariables(textContent, contextMap, promptMap);
      } else if ($isQuoteNode(node)) {
        const textContent = node.getTextContent();
        const textNodes = extractTextNodes(node);
        
        lexicalJson.root.children.push({
          type: 'quote',
          children: textNodes.length > 0 ? textNodes : [{ type: 'text', text: textContent }]
        });

        // Extract variables from text content
        extractVariables(textContent, contextMap, promptMap);
      } else if ($isListNode(node)) {
        const listType = node.getListType();
        const items: TextNode[][] = [];
        
        // Get all list items with their formatting
        const listChildren = node.getChildren();
        for (const listChild of listChildren) {
          if ($isListItemNode(listChild)) {
            const itemText = listChild.getTextContent();
            const textNodes = extractTextNodes(listChild);
            items.push(textNodes.length > 0 ? textNodes : [{ type: 'text', text: itemText }]);
            extractVariables(itemText, contextMap, promptMap);
          }
        }
        
        lexicalJson.root.children.push({
          type: 'list',
          listType: listType,
          children: items.flat().map((textNode, index) => ({
            ...textNode,
            type: index === 0 || items[Math.floor(index / items.length)] ? 'listitem' : 'text'
          }))
        });
      } else if (node.getType() === 'paragraph') {
        const textContent = node.getTextContent();
        const textNodes = extractTextNodes(node);
        
        lexicalJson.root.children.push({
          type: 'paragraph',
          children: textNodes.length > 0 ? textNodes : [{ type: 'text', text: textContent }]
        });

        // Extract variables from text content
        extractVariables(textContent, contextMap, promptMap);
      }
    }
  });

  return {
    lexical_json: lexicalJson,
    context_map: contextMap,
    prompt_map: promptMap
  };
}

function extractVariables(text: string, contextMap: Record<string, string>, promptMap: Record<string, string>) {
  // Extract {{variable}} patterns
  const variableRegex = /\{\{([^}]+)\}\}/g;
  let match: RegExpExecArray | null;
  
  // Fix linter error by separating assignment from condition
  match = variableRegex.exec(text);
  while (match !== null) {
    const varName = match[1];
    if (!contextMap[varName]) {
      contextMap[varName] = `[${varName}]`; // placeholder value
    }
    match = variableRegex.exec(text);
  }

  // Extract [[prompt]] patterns  
  const promptRegex = /\[\[([^\]]+)\]\]/g;
  match = promptRegex.exec(text);
  while (match !== null) {
    const promptName = match[1];
    if (!promptMap[promptName]) {
      promptMap[promptName] = `[${promptName} description]`; // placeholder value
    }
    match = promptRegex.exec(text);
  }
}

interface JsonOutput {
  lexical_json: {
    root: {
      children: Array<{
        type: string;
        level?: number;
        listType?: string;
        children: Array<{
          type: string;
          text: string;
          format?: number;
          style?: string;
        }>;
      }>;
    };
  };
  context_map: Record<string, string>;
  prompt_map: Record<string, string>;
}

// Plugin to load template content from custom format
function TemplateLoaderPlugin({ templateData }: { templateData: any }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (templateData?.lexical_json?.root?.children) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        // Convert custom format back to Lexical nodes
        for (const child of templateData.lexical_json.root.children) {
          let node;
          
          if (child.type === 'heading') {
            node = $createHeadingNode(child.level as HeadingTagType || 'h1');
          } else if (child.type === 'quote') {
            node = $createQuoteNode();
          } else {
            // Default to paragraph
            node = $createParagraphNode();
          }
          
          // Add text children
          if (child.children) {
            for (const textChild of child.children) {
              if (textChild.type === 'text' && textChild.text) {
                const textNode = $createTextNode(textChild.text);
                // Apply formatting if present
                if (textChild.format) {
                  if (textChild.format & 1) textNode.toggleFormat('bold');
                  if (textChild.format & 2) textNode.toggleFormat('italic');
                  if (textChild.format & 4) textNode.toggleFormat('strikethrough');
                  if (textChild.format & 8) textNode.toggleFormat('underline');
                }
                node.append(textNode);
              }
            }
          }
          
          root.append(node);
        }
      });
    }
  }, [editor, templateData]);
  
  return null;
}

export function LexicalEditor({ templateId }: { templateId?: string }) {
  const [jsonOutput, setJsonOutput] = useState<JsonOutput | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>('');
  const [templateData, setTemplateData] = useState<any>(null);

  const initialConfig = {
    namespace: 'WordAIEditor',
    theme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  // Load template data when templateId is provided
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);


  const loadTemplate = async (id: string) => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await fetch(`/api/template/${id}/`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Template not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      setTemplateName(data.name);
      setTemplateData(data);
      
    } catch (err) {
      setLoadError(`Failed to load template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onChange = (editorState: EditorState) => {
    const customFormat = convertEditorStateToCustomFormat(editorState);
    setJsonOutput(customFormat);
  };

  const handleSaveTemplate = async () => {
    if (!jsonOutput || !templateName.trim()) {
      setSaveMessage('Please enter a template name and add some content.');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      const isEditing = !!templateId;
      const url = isEditing ? `/api/template/${templateId}/edit/` : '/api/template/add/';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName.trim(),
          lexical_json: jsonOutput.lexical_json,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSaveMessage(`Template "${result.name}" ${isEditing ? 'updated' : 'saved'} successfully with ID: ${result.id}`);
        if (!isEditing) {
          setTemplateName(''); // Clear the template name after successful save (only for new templates)
        }
      } else {
        const error = await response.json();
        setSaveMessage(`Error ${isEditing ? 'updating' : 'saving'} template: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      setSaveMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state when loading template
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  // Show error state when loading template fails
  if (loadError) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white border border-gray-300 rounded-lg p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error: </strong>
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => templateId && loadTemplate(templateId)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <LexicalComposer initialConfig={initialConfig} key={templateId || 'new'}>
          <ToolbarPlugin />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className="min-h-[400px] max-h-[600px] p-4 outline-none resize-none overflow-y-auto"
                  style={{
                    // Custom CSS for variable highlighting
                    fontSize: '15px',
                    lineHeight: '1.5',
                  }}
                />
              }
              placeholder={
                <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                  Start typing your template... Use {"{{variable}}"} for variables and {"[[prompt]]"} for AI prompts.
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={onChange} />
            <HistoryPlugin />
            <ListPlugin />
            {/* Load template content using standard Lexical approach */}
            <TemplateLoaderPlugin templateData={templateData} />
          </div>
        </LexicalComposer>
      </div>

      {/* Save Template Section */}
      <div className="mt-6 bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-bold mb-3">{templateId ? 'Update Template' : 'Save Template'}</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-1">
              Template Name
            </label>
            <input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSaving}
            />
          </div>
          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={isSaving || !jsonOutput || !templateName.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {templateId ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              templateId ? 'Update Template' : 'Save Template'
            )}
          </button>
        </div>
        {saveMessage && (
          <div className={`mt-3 p-3 rounded-md text-sm ${
            saveMessage.includes('Error') || saveMessage.includes('Network error') 
              ? 'bg-red-100 text-red-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {saveMessage}
          </div>
        )}
      </div>

      {/* Debug JSON Output */}
      {jsonOutput && (
        <div className="mt-6 bg-gray-100 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Debug JSON Output:</h3>
          <pre className="text-xs overflow-auto bg-white p-3 rounded border">
            {JSON.stringify(jsonOutput, null, 2)}
          </pre>
        </div>
      )}

      {/* CSS for variable highlighting */}
      <style>{`
        .lexical-editor-text:has-text('{{') {
          background-color: #fef3c7;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
} 