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
  $createRangeSelection,
  $setSelection,
  $insertNodes,
  $getNodeByKey,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  TextNode,
} from 'lexical';
import type { 
  ElementNode,
  NodeKey,
  LexicalNode,
  EditorConfig,
  SerializedTextNode,
  RangeSelection,
} from 'lexical';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Undo2,
  Redo2,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Quote,
  AtSign,
  Edit3,
  X,
  Save
} from 'lucide-react';
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
  REMOVE_LIST_COMMAND,
  $createListNode,
  $createListItemNode
} from '@lexical/list';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { 
  $getSelectionStyleValueForProperty,
  $patchStyleText
} from '@lexical/selection';
import { mergeRegister } from '@lexical/utils';
import type { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';

// Variable Definition Interface
interface VariableDefinition {
  id: string;
  name: string;
  type: 'variable' | 'prompt';
  prompt?: string; // Only used for prompt type
  defaultValue?: string;
}

// Custom Variable Node
export class VariableNode extends TextNode {
  __variableId: string;
  __variableType: 'variable' | 'prompt';

  static getType(): string {
    return 'variable';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__variableId, node.__variableType, node.__text, node.__key);
  }

  constructor(variableId: string, variableType: 'variable' | 'prompt', text: string, key?: NodeKey) {
    super(text, key);
    this.__variableId = variableId;
    this.__variableType = variableType;
  }

  getVariableId(): string {
    return this.__variableId;
  }

  getVariableType(): 'variable' | 'prompt' {
    return this.__variableType;
  }

  setVariableId(variableId: string): void {
    const writable = this.getWritable();
    writable.__variableId = variableId;
  }

  setVariableType(variableType: 'variable' | 'prompt'): void {
    const writable = this.getWritable();
    writable.__variableType = variableType;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    
    // Different styling based on variable type
    if (this.__variableType === 'prompt') {
      // AI Prompt variables - purple/violet theme
      element.style.backgroundColor = '#ede9fe';
      element.style.border = '1px solid #a78bfa';
      element.style.color = '#7c3aed';
    } else {
      // Regular variables - blue theme  
      element.style.backgroundColor = '#dbeafe';
      element.style.border = '1px solid #93c5fd';
      element.style.color = '#1d4ed8';
    }
    
    element.style.padding = '1px 3px';
    element.style.borderRadius = '3px';
    element.style.cursor = 'pointer';
    element.style.textDecoration = 'none';
    element.style.display = 'inline';
    element.style.userSelect = 'none';
    element.style.transition = 'all 0.2s ease';
    
    // Add hover effect
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'scale(1.05)';
      element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    element.addEventListener('mouseleave', () => {
      element.style.transform = 'scale(1)';
      element.style.boxShadow = 'none';
    });
    element.setAttribute('data-variable-id', this.__variableId);
    element.setAttribute('data-variable-type', this.__variableType);
    element.title = `${this.__variableType === 'prompt' ? 'AI Prompt' : 'Variable'}: ${this.__variableId} (Click to edit)`;
    // Remove contenteditable to prevent cursor trapping
    element.setAttribute('contenteditable', 'false');
    return element;
  }

  updateDOM(prevNode: VariableNode, dom: HTMLElement, config: EditorConfig): boolean {
    const updated = super.updateDOM(prevNode, dom, config);
    dom.setAttribute('data-variable-id', this.__variableId);
    dom.setAttribute('data-variable-type', this.__variableType);
    dom.title = `${this.__variableType === 'prompt' ? 'AI Prompt' : 'Variable'}: ${this.__variableId}`;
    return updated;
  }

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    const { variableId, variableType, text, format, style } = serializedNode;
    const node = $createVariableNode(variableId, variableType || 'variable', text);
    if (format) {
      node.setFormat(format);
    }
    if (style) {
      node.setStyle(style);
    }
    return node;
  }

  exportJSON(): SerializedVariableNode {
    return {
      ...super.exportJSON(),
      variableId: this.__variableId,
      variableType: this.__variableType,
      type: 'variable',
      version: 1,
    };
  }

  // Allow this node to be selected but not directly edited
  isSelectable(): boolean {
    return true;
  }

  isEditable(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  // Keep it as a text entity for proper cursor flow
  isTextEntity(): boolean {
    return true;
  }

  // Allow the cursor to move around this node
  isInline(): true {
    return true;
  }

  // Handle backspace/delete when this node is selected
  isToken(): boolean {
    return true;
  }

  // Make the text non-editable but allow cursor movement
  isImmutable(): boolean {
    return true;
  }
}

export interface SerializedVariableNode extends SerializedTextNode {
  variableId: string;
  variableType: 'variable' | 'prompt';
  type: 'variable';
  version: 1;
}

export function $createVariableNode(variableId: string, variableType: 'variable' | 'prompt', text: string): VariableNode {
  return new VariableNode(variableId, variableType, text);
}

export function $isVariableNode(node: LexicalNode | null | undefined): node is VariableNode {
  return node instanceof VariableNode;
}

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

// Variable Selection Popup Component
function VariableSelectionPopup({ 
  isOpen, 
  onClose, 
  onSelectVariable,
  onCreateNew,
  variables, 
  position 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectVariable: (variable: VariableDefinition) => void;
  onCreateNew: (position: { x: number; y: number }) => void;
  variables: VariableDefinition[];
  position: { x: number; y: number };
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVariables = variables.filter(variable =>
    variable.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-80 max-h-80 overflow-hidden"
      style={{ 
        left: Math.min(position.x, window.innerWidth - 320), 
        top: Math.min(position.y, window.innerHeight - 320) 
      }}
    >
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Insert Variable</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search variables..."
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="max-h-48 overflow-y-auto">
        {filteredVariables.length > 0 ? (
          <div className="p-1">
            {filteredVariables.map((variable) => (
              <button
                key={variable.id}
                type="button"
                onClick={() => onSelectVariable(variable)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${
                  variable.type === 'prompt' ? 'bg-purple-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="font-medium">{variable.name}</div>
                  <div className="text-xs text-gray-500">
                    {variable.type === 'prompt' ? 'AI Prompt' : 'Variable'}
                    {variable.defaultValue && ` • ${variable.defaultValue}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchTerm ? 'No variables found' : 'No variables created yet'}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onCreateNew(position)}
          className="w-full px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
        >
          <Edit3 className="w-3 h-3" />
          Create New Variable
        </button>
      </div>
    </div>
  );
}

// Variable Popup Component
function VariablePopup({ 
  isOpen, 
  onClose, 
  onSave, 
  variable, 
  position 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variable: VariableDefinition) => void;
  variable?: VariableDefinition;
  position: { x: number; y: number };
}) {
  const [name, setName] = useState(variable?.name || '');
  const [type, setType] = useState<'variable' | 'prompt'>(variable?.type || 'variable');
  const [prompt, setPrompt] = useState(variable?.prompt || '');
  const [defaultValue, setDefaultValue] = useState(variable?.defaultValue || '');

  useEffect(() => {
    if (variable) {
      setName(variable.name);
      setType(variable.type || 'variable');
      setPrompt(variable.prompt || '');
      setDefaultValue(variable.defaultValue || '');
    } else {
      setName('');
      setType('variable');
      setPrompt('');
      setDefaultValue('');
    }
  }, [variable]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (type === 'prompt' && !prompt.trim()) return;
    
    onSave({
      id: variable?.id || `var_${Date.now()}`,
      name: name.trim(),
      type: type,
      prompt: type === 'prompt' ? prompt.trim() : undefined,
      defaultValue: defaultValue.trim() || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-80"
      style={{ 
        left: Math.min(position.x, window.innerWidth - 320), 
        top: Math.min(position.y, window.innerHeight - 300) 
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">
          {variable ? 'Edit Variable' : 'Add Variable'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Variable Type *
          </label>
          <div className="space-y-3">
            <label className={`
              flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all
              ${type === 'variable' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }
            `}>
              <input
                type="radio"
                name="variableType"
                value="variable"
                checked={type === 'variable'}
                onChange={(e) => setType(e.target.value as 'variable' | 'prompt')}
                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-blue-600">Regular Variable</span>
                </div>
                <p className="text-sm text-gray-600">
                  Simple placeholder that gets replaced with actual values (e.g., {"{{name}}"})
                </p>
              </div>
            </label>
            
            <label className={`
              flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all
              ${type === 'prompt' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }
            `}>
              <input
                type="radio"
                name="variableType"
                value="prompt"
                checked={type === 'prompt'}
                onChange={(e) => setType(e.target.value as 'variable' | 'prompt')}
                className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-purple-600">AI Prompt</span>
                </div>
                <p className="text-sm text-gray-600">
                  Content generated by AI based on your prompt instructions (e.g., [[greeting]])
                </p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="variable-name" className="block text-sm font-medium text-gray-700 mb-1">
            Variable Name *
          </label>
          <input
            id="variable-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'variable' ? "e.g., customer_name" : "e.g., greeting"}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {type === 'prompt' && (
          <div>
            <label htmlFor="variable-prompt" className="block text-sm font-medium text-gray-700 mb-1">
              AI Prompt * <span className="text-gray-500">(can include variables)</span>
            </label>
            <textarea
              id="variable-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Generate a personalized greeting for customer"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        )}

        <div>
          <label htmlFor="variable-default" className="block text-sm font-medium text-gray-700 mb-1">
            Default Value (optional)
          </label>
          <input
            id="variable-default"
            type="text"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder={type === 'variable' ? "e.g., [Customer Name]" : "e.g., Hello there!"}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
}

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

// Variable Click Handler Plugin
function VariableClickPlugin({ 
  variables,
  onEditVariable 
}: { 
  variables: VariableDefinition[];
  onEditVariable: (variable: VariableDefinition, position: { x: number; y: number }) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the clicked element is a variable
      if (target?.hasAttribute('data-variable-id')) {
        event.preventDefault();
        event.stopPropagation();
        
        const variableId = target.getAttribute('data-variable-id');
        const variableType = (target.getAttribute('data-variable-type') as 'variable' | 'prompt') || 'variable';
        
        // Try to find the variable in the loaded variables array
        let variable = variables.find(v => v.id === variableId);
        
        // If not found, create a temporary variable definition from the DOM element
        if (!variable && variableId) {
          // Extract the variable name from the element text content
          const elementText = target.textContent || '';
          let variableName = variableId;
          
          // Try to extract name from text like "{{varName}}" or "[[promptName]]"
          if (elementText.includes('{{') && elementText.includes('}}')) {
            const match = elementText.match(/\{\{([^}]+)\}\}/);
            if (match) variableName = match[1];
          } else if (elementText.includes('[[') && elementText.includes(']]')) {
            const match = elementText.match(/\[\[([^\]]+)\]\]/);
            if (match) variableName = match[1];
          } else if (elementText.trim()) {
            // If no brackets found, use the element text as is
            variableName = elementText.trim();
          }
          
          // Create a temporary variable definition
          variable = {
            id: variableId,
            name: variableName,
            type: variableType,
            prompt: variableType === 'prompt' ? '' : undefined,
            defaultValue: undefined,
          };
        }
        
        if (variable) {
          // Get click position for popup
          const rect = target.getBoundingClientRect();
          const position = {
            x: rect.left,
            y: rect.bottom + 5
          };
          
          onEditVariable(variable, position);
        }
      }
    };

    // Add click listener to the editor root
    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('click', handleClick);
      
      return () => {
        rootElement.removeEventListener('click', handleClick);
      };
    }
  }, [editor, variables, onEditVariable]);

  return null;
}

// Variable Insertion Plugin
function VariableInsertionPlugin({ 
  onInsertVariable,
  variableToInsert,
  onVariableInserted
}: { 
  onInsertVariable: (position: { x: number; y: number }) => void;
  variableToInsert: VariableDefinition | null;
  onVariableInserted: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [triggerPosition, setTriggerPosition] = useState<{ startOffset: number; endOffset: number; node: TextNode } | null>(null);

  // Insert variable when variableToInsert changes
  useEffect(() => {
    if (variableToInsert && triggerPosition) {
      editor.update(() => {
        const { startOffset, endOffset, node } = triggerPosition;
        
        // Create the variable node
        const prefix = variableToInsert.type === 'prompt' ? '[[' : '{{';
        const suffix = variableToInsert.type === 'prompt' ? ']]' : '}}';
        const variableNode = $createVariableNode(
          variableToInsert.id,
          variableToInsert.type,
          `${prefix}${variableToInsert.name}${suffix}`
        );

        // Get the text content and split it
        const originalText = node.getTextContent();
        const textBefore = originalText.slice(0, startOffset);
        const textAfter = originalText.slice(endOffset);
        
        // Preserve formatting from the original node
        const originalFormat = node.getFormat();
        const originalStyle = node.getStyle();
        
        // Update the original node with text before the trigger
        node.setTextContent(textBefore);
        
        // Insert the variable node after the current node
        node.insertAfter(variableNode);
        
        // Add text after the variable (if any) and a space for cursor positioning
        if (textAfter.length > 0) {
          const afterTextNode = $createTextNode(textAfter);
          // Apply original formatting to the after text
          if (originalFormat) {
            afterTextNode.setFormat(originalFormat);
          }
          if (originalStyle) {
            afterTextNode.setStyle(originalStyle);
          }
          variableNode.insertAfter(afterTextNode);
          // Position cursor at the start of the after text
          const newSelection = $createRangeSelection();
          newSelection.anchor.set(afterTextNode.getKey(), 0, 'text');
          newSelection.focus.set(afterTextNode.getKey(), 0, 'text');
          $setSelection(newSelection);
        } else {
          // Add a space after the variable for better cursor positioning
          const spaceNode = $createTextNode(' ');
          // Apply original formatting to the space (so continued typing has same format)
          if (originalFormat) {
            spaceNode.setFormat(originalFormat);
          }
          if (originalStyle) {
            spaceNode.setStyle(originalStyle);
          }
          variableNode.insertAfter(spaceNode);
          // Position cursor after the space
          const newSelection = $createRangeSelection();
          newSelection.anchor.set(spaceNode.getKey(), 1, 'text');
          newSelection.focus.set(spaceNode.getKey(), 1, 'text');
          $setSelection(newSelection);
        }
        
        // Clear the trigger position
        setTriggerPosition(null);
      });
      onVariableInserted();
    }
  }, [editor, variableToInsert, onVariableInserted, triggerPosition]);

  useEffect(() => {
    const checkForVariableTrigger = () => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          if ($isTextNode(anchorNode)) {
            const nodeText = anchorNode.getTextContent();
            const cursorOffset = selection.anchor.offset;
            const textBeforeCursor = nodeText.slice(0, cursorOffset);
            const lastAtIndex = textBeforeCursor.lastIndexOf('@');
            
            // Check if we have @ followed by optional word characters
            if (lastAtIndex !== -1) {
              const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
              
              // Trigger if @ is followed by word characters only (no spaces) and within reasonable length
              if (textAfterAt.length <= 10 && textAfterAt.match(/^\w*$/)) {
                
                setTriggerPosition({
                  startOffset: lastAtIndex,
                  endOffset: cursorOffset,
                  node: anchorNode
                });
                
                // Get cursor position for popup
                const rect = window.getSelection()?.getRangeAt(0).getBoundingClientRect();
                if (rect) {
                  onInsertVariable({ x: rect.left, y: rect.bottom + 5 });
                }
              }
            }
          }
        }
      });
    };

    return editor.registerTextContentListener(() => {
      // Use a small delay to ensure the DOM has updated
      setTimeout(checkForVariableTrigger, 0);
    });
  }, [editor, onInsertVariable]);

  return null;
}

// Toolbar plugin with variable insertion
function ToolbarPlugin({ 
  onInsertVariable 
}: { 
  onInsertVariable: (position: { x: number; y: number }) => void 
}) {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] = useState('paragraph');
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(null);
  const [fontSize, setFontSize] = useState<string>('15px');
  const [fontColor, setFontColor] = useState<string>('#000');
  const [bgColor, setBgColor] = useState<string>('#fff');
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
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

      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Update block type
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }
      // Update font properties
      setFontSize(
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      setFontColor(
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      setBgColor(
        $getSelectionStyleValueForProperty(
          selection,
          'background-color',
          '#fff',
        ),
      );
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );
    }
  }, [activeEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          $updateToolbar();
          setActiveEditor(_newEditor);
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [activeEditor, editor, $updateToolbar]);

  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, {
          'font-size': null,
          'color': null,
          'background-color': null,
          'font-family': null,
        });
      }
    });
  }, [activeEditor]);

  const onFontColorSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            color: value,
          });
        }
      });
    },
    [activeEditor],
  );

  const onBgColorSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            'background-color': value,
          });
        }
      });
    },
    [activeEditor],
  );

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

  const onFontFamilySelect = useCallback(
    (value: string) => {
      applyStyleText({ 'font-family': value });
    },
    [applyStyleText],
  );

  const onFontSizeSelect = useCallback(
    (value: string) => {
      applyStyleText({ 'font-size': value });
    },
    [applyStyleText],
  );

  const insertVariable = () => {
    // Get current cursor position
    const rect = window.getSelection()?.getRangeAt(0)?.getBoundingClientRect();
    if (rect) {
      onInsertVariable({ x: rect.left, y: rect.bottom + 5 });
    }
  };

  const blockTypeToBlockName = {
    paragraph: 'Normal',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    h6: 'Heading 6',
    bullet: 'Bulleted List',
    number: 'Numbered List',
    quote: 'Quote',
  } as const;

  const formatParagraph = () => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      activeEditor.update(() => {
        const selection = $getSelection();
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      activeEditor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      activeEditor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      activeEditor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      activeEditor.update(() => {
        const selection = $getSelection();
        $setBlocksType(selection, () => $createQuoteNode());
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
      {/* Undo/Redo */}
      <div className="flex">
        <ToolbarButton
          disabled={!canUndo}
          onClick={() => activeEditor.dispatchCommand(UNDO_COMMAND, undefined)}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          disabled={!canRedo}
          onClick={() => activeEditor.dispatchCommand(REDO_COMMAND, undefined)}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Block Type */}
      <ToolbarDropdown
        value={blockType}
        onChange={(value) => {
          if (value === 'paragraph') {
            formatParagraph();
          } else if (value === 'h1') {
            formatHeading('h1');
          } else if (value === 'h2') {
            formatHeading('h2');
          } else if (value === 'h3') {
            formatHeading('h3');
          } else if (value === 'h4') {
            formatHeading('h4');
          } else if (value === 'h5') {
            formatHeading('h5');
          } else if (value === 'h6') {
            formatHeading('h6');
          } else if (value === 'bullet') {
            formatBulletList();
          } else if (value === 'number') {
            formatNumberedList();
          } else if (value === 'quote') {
            formatQuote();
          }
        }}
        options={Object.entries(blockTypeToBlockName)}
      />

      <div className="w-px h-6 bg-gray-300 mx-1" />

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

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text Formatting */}
      <div className="flex">
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          active={isBold}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          active={isItalic}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          active={isUnderline}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
          active={isStrikethrough}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Colors */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">Color:</span>
        <ColorPicker value={fontColor} onChange={onFontColorSelect} />
        <span className="text-xs text-gray-600">BG:</span>
        <ColorPicker value={bgColor} onChange={onBgColorSelect} />
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Alignment */}
      <div className="flex">
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
          title="Align Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists */}
      <div className="flex">
        <ToolbarButton
          onClick={formatBulletList}
          title="Bulleted List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={formatNumberedList}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Indent */}
      <div className="flex">
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
          title="Outdent"
        >
          <Outdent className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
          title="Indent"
        >
          <Indent className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Quote */}
      <ToolbarButton
        onClick={formatQuote}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Variable Insert */}
      <ToolbarButton
        onClick={insertVariable}
        title="Insert Variable"
      >
        <AtSign className="w-4 h-4" />
      </ToolbarButton>

      <div className="flex-1" />

      {/* Clear Formatting */}
      <button
        type="button"
        onClick={clearFormatting}
        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
      >
        Clear Format
      </button>
    </div>
  );
}

// Helper functions
function $findMatchingParent(
  node: LexicalNode,
  findFn: (node: LexicalNode) => boolean,
): LexicalNode | null {
  let curr = node;

  while (curr !== null && curr.getParent() !== null && !findFn(curr)) {
    curr = curr.getParent();
  }

  return findFn(curr) ? curr : null;
}

function $isRootOrShadowRoot(node: LexicalNode): boolean {
  return node.getParent() === null;
}

function $getNearestNodeOfType<T extends LexicalNode>(
  node: LexicalNode,
  klass: new (...args: never[]) => T,
): T | null {
  let parent = node;

  while (parent != null) {
    if (parent instanceof klass) {
      return parent;
    }

    parent = parent.getParent();
  }

  return null;
}

function $setBlocksType(selection: any, createElement: () => LexicalNode): void {
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

// Function to convert Lexical editor state to our new custom format
function convertEditorStateToCustomFormat(editorState: EditorState, variables: VariableDefinition[]) {
  interface TextNode {
    type: string;
    text: string;
    format?: number;
    style?: string;
    variableId?: string;
    variableType?: 'variable' | 'prompt';
  }

  interface ChildNode {
    type: string;
    level?: number;
    listType?: string;
    children: Array<TextNode | { type: string; children: TextNode[] }>;
  }
  
  const lexicalJson = { root: { children: [] as ChildNode[] } };

  // Helper function to extract text nodes with their formatting
  const extractTextNodes = (node: LexicalNode): TextNode[] => {
    const textNodes: TextNode[] = [];
    const children = node.getChildren();
    
    for (const child of children) {
      if (child.getType() === 'text') {
        const textNode: TextNode = {
          type: 'text',
          text: child.getTextContent()
        };
        
        // Add format information if present
        if ('getFormat' in child && typeof child.getFormat === 'function') {
          const format = child.getFormat();
          if (format) {
            textNode.format = format;
          }
        }
        
        // Add style information if present
        if ('getStyle' in child && typeof child.getStyle === 'function') {
          const style = child.getStyle();
          if (style) {
            textNode.style = style;
          }
        }
        
        textNodes.push(textNode);
      } else if (child.getType() === 'variable') {
        const variableNode = child as VariableNode;
        const textNode: TextNode = {
          type: 'variable',
          text: variableNode.getTextContent(),
          variableId: variableNode.getVariableId(),
          variableType: variableNode.getVariableType()
        };
        
        // Add format information if present
        const format = variableNode.getFormat();
        if (format) {
          textNode.format = format;
        }
        
        // Add style information if present
        const style = variableNode.getStyle();
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
      } else if ($isQuoteNode(node)) {
        const textContent = node.getTextContent();
        const textNodes = extractTextNodes(node);
        
        lexicalJson.root.children.push({
          type: 'quote',
          children: textNodes.length > 0 ? textNodes : [{ type: 'text', text: textContent }]
        });
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
          }
        }
        
        // Create proper list structure with each item as a separate listitem
        const listItems = items.map(itemNodes => ({
          type: 'listitem',
          children: itemNodes
        }));
        
        lexicalJson.root.children.push({
          type: 'list',
          listType: listType,
          children: listItems
        });
      } else if (node.getType() === 'paragraph') {
        const textContent = node.getTextContent();
        const textNodes = extractTextNodes(node);
        
        lexicalJson.root.children.push({
          type: 'paragraph',
          children: textNodes.length > 0 ? textNodes : [{ type: 'text', text: textContent }]
        });
      }
    }
  });

  return {
    lexical_json: lexicalJson,
    variables: variables
  };
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
          text?: string;
          format?: number;
          style?: string;
          variableId?: string;
          variableType?: 'variable' | 'prompt';
          children?: Array<{
            type: string;
            text: string;
            format?: number;
            style?: string;
            variableId?: string;
            variableType?: 'variable' | 'prompt';
          }>;
        }>;
      }>;
    };
  };
  variables: VariableDefinition[];
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
            const headingTag = `h${child.level || 1}` as HeadingTagType;
            node = $createHeadingNode(headingTag);
          } else if (child.type === 'quote') {
            node = $createQuoteNode();
          } else if (child.type === 'list') {
            // Handle list nodes
            const listType = child.listType === 'number' ? 'number' : 'bullet';
            node = listType === 'number' 
              ? $createListNode('number') 
              : $createListNode('bullet');
          } else {
            // Default to paragraph
            node = $createParagraphNode();
          }
          
          // Add text children
          if (child.children) {
            for (const textChild of child.children) {
              if (textChild.type === 'listitem' && textChild.children) {
                // Handle list items
                const listItemNode = $createListItemNode();
                
                for (const itemTextChild of textChild.children) {
                  if (itemTextChild.type === 'text' && itemTextChild.text) {
                    const textNode = $createTextNode(itemTextChild.text);
                    // Apply formatting if present
                    if (itemTextChild.format) {
                      if (itemTextChild.format & 1) textNode.toggleFormat('bold');
                      if (itemTextChild.format & 2) textNode.toggleFormat('italic');
                      if (itemTextChild.format & 4) textNode.toggleFormat('strikethrough');
                      if (itemTextChild.format & 8) textNode.toggleFormat('underline');
                    }
                    // Apply inline styles if present
                    if (itemTextChild.style) {
                      textNode.setStyle(itemTextChild.style);
                    }
                    listItemNode.append(textNode);
                  } else if (itemTextChild.type === 'variable' && itemTextChild.variableId) {
                    // Handle variables in list items
                    let variableType = itemTextChild.variableType;
                    if (!variableType && templateData.variables) {
                      const variableDefinition = templateData.variables.find((v: VariableDefinition) => v.id === itemTextChild.variableId);
                      variableType = variableDefinition?.type || 'variable';
                    } else {
                      variableType = variableType || 'variable';
                    }
                    const variableNode = $createVariableNode(itemTextChild.variableId, variableType, itemTextChild.text || '');
                    // Apply formatting if present
                    if (itemTextChild.format) {
                      if (itemTextChild.format & 1) variableNode.toggleFormat('bold');
                      if (itemTextChild.format & 2) variableNode.toggleFormat('italic');
                      if (itemTextChild.format & 4) variableNode.toggleFormat('strikethrough');
                      if (itemTextChild.format & 8) variableNode.toggleFormat('underline');
                    }
                    // Apply inline styles if present
                    if (itemTextChild.style) {
                      variableNode.setStyle(itemTextChild.style);
                    }
                    listItemNode.append(variableNode);
                  }
                }
                
                node.append(listItemNode);
              } else if (textChild.type === 'text' && textChild.text) {
                const textNode = $createTextNode(textChild.text);
                // Apply formatting if present
                if (textChild.format) {
                  if (textChild.format & 1) textNode.toggleFormat('bold');
                  if (textChild.format & 2) textNode.toggleFormat('italic');
                  if (textChild.format & 4) textNode.toggleFormat('strikethrough');
                  if (textChild.format & 8) textNode.toggleFormat('underline');
                }
                // Apply inline styles if present
                if (textChild.style) {
                  textNode.setStyle(textChild.style);
                }
                node.append(textNode);
              } else if (textChild.type === 'variable' && textChild.variableId) {
                // Try to get variable type from stored data, fallback to variables array, then default to 'variable'
                let variableType = textChild.variableType;
                if (!variableType && templateData.variables) {
                  const variableDefinition = templateData.variables.find((v: VariableDefinition) => v.id === textChild.variableId);
                  variableType = variableDefinition?.type || 'variable';
                } else {
                  variableType = variableType || 'variable';
                }
                const variableNode = $createVariableNode(textChild.variableId, variableType, textChild.text || '');
                // Apply formatting if present
                if (textChild.format) {
                  if (textChild.format & 1) variableNode.toggleFormat('bold');
                  if (textChild.format & 2) variableNode.toggleFormat('italic');
                  if (textChild.format & 4) variableNode.toggleFormat('strikethrough');
                  if (textChild.format & 8) variableNode.toggleFormat('underline');
                }
                // Apply inline styles if present
                if (textChild.style) {
                  variableNode.setStyle(textChild.style);
                }
                node.append(variableNode);
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
  
  // New variable management state
  const [variables, setVariables] = useState<VariableDefinition[]>([]);
  const [showVariablePopup, setShowVariablePopup] = useState(false);
  const [showVariableSelectionPopup, setShowVariableSelectionPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [editingVariable, setEditingVariable] = useState<VariableDefinition | undefined>();

  const [variableToInsert, setVariableToInsert] = useState<VariableDefinition | null>(null);

  const initialConfig = {
    namespace: 'WordyEditor',
    theme,
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, VariableNode],
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
      
      // Load variables from template data
      if (data.variables) {
        setVariables(data.variables);
      }
      
    } catch (err) {
      setLoadError(`Failed to load template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onChange = (editorState: EditorState) => {
    const customFormat = convertEditorStateToCustomFormat(editorState, variables);
    setJsonOutput(customFormat);
  };

  const handleInsertVariable = (position: { x: number; y: number }) => {
    setPopupPosition(position);
    setShowVariableSelectionPopup(true);
  };

  const handleSelectExistingVariable = (variable: VariableDefinition) => {
    setVariableToInsert(variable);
    setShowVariableSelectionPopup(false);
  };

  const handleCreateNewVariable = (position: { x: number; y: number }) => {
    setPopupPosition(position);
    setEditingVariable(undefined);
    setShowVariableSelectionPopup(false);
    setShowVariablePopup(true);
  };

  const handleSaveVariable = (variable: VariableDefinition) => {
    setVariables(prev => {
      const existing = prev.find(v => v.id === variable.id);
      if (existing) {
        return prev.map(v => v.id === variable.id ? variable : v);
      }
      return [...prev, variable];
    });

    // Insert variable into editor if it's a new variable
    if (!editingVariable) {
      setVariableToInsert(variable);
    }
    
    setShowVariablePopup(false);
    setEditingVariable(undefined);
  };

  const handleEditVariable = (variable: VariableDefinition, position?: { x: number; y: number }) => {
    setEditingVariable(variable);
    if (position) {
      setPopupPosition(position);
    } else {
      setPopupPosition({ x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 150 });
    }
    setShowVariablePopup(true);
  };

  const handleDeleteVariable = (variableId: string) => {
    setVariables(prev => prev.filter(v => v.id !== variableId));
    // TODO: Remove variable nodes from editor
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
          variables: variables,
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
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
          <ToolbarPlugin onInsertVariable={handleInsertVariable} />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className="min-h-[400px] max-h-[600px] p-4 outline-none resize-none overflow-y-auto"
                  style={{
                    fontSize: '15px',
                    lineHeight: '1.5',
                  }}
                />
              }
              placeholder={
                <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                  Start typing your template... Use the @ button or type @ to add variables.
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={onChange} />
            <HistoryPlugin />
            <ListPlugin />
            <VariableInsertionPlugin 
              onInsertVariable={handleInsertVariable}
              variableToInsert={variableToInsert}
              onVariableInserted={() => setVariableToInsert(null)}
            />
            <VariableClickPlugin 
              variables={variables}
              onEditVariable={handleEditVariable}
            />
            {/* Load template content using standard Lexical approach */}
            <TemplateLoaderPlugin templateData={templateData} />
          </div>
        </LexicalComposer>
      </div>

      {/* Variable Selection Popup */}
      <VariableSelectionPopup
        isOpen={showVariableSelectionPopup}
        onClose={() => setShowVariableSelectionPopup(false)}
        onSelectVariable={handleSelectExistingVariable}
        onCreateNew={handleCreateNewVariable}
        variables={variables}
        position={popupPosition}
      />

      {/* Variable Popup */}
      <VariablePopup
        isOpen={showVariablePopup}
        onClose={() => setShowVariablePopup(false)}
        onSave={handleSaveVariable}
        variable={editingVariable}
        position={popupPosition}
      />

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
    </div>
  );
} 