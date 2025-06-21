import React, { useEffect, useState } from 'react';
import { $createParagraphNode, $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $createHeadingNode, $isHeadingNode, HeadingNode } from '@lexical/rich-text';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';

// Custom theme for styling
const theme = {
  text: {
    bold: 'font-bold',
    italic: 'italic',
  },
  paragraph: 'mb-2',
  heading: {
    h1: 'text-3xl font-bold mb-4 mt-6',
    h2: 'text-2xl font-bold mb-3 mt-5',
    h3: 'text-xl font-bold mb-2 mt-4',
  },
};

// Plugin to handle toolbar actions
function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatHeading = (level: 1 | 2 | 3) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const headingNode = $createHeadingNode(`h${level}`);
        selection.insertNodes([headingNode]);
      }
    });
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const paragraphNode = $createParagraphNode();
        selection.insertNodes([paragraphNode]);
      }
    });
  };

  return (
    <div className="border-b border-gray-200 p-3 flex gap-2 bg-white">
      <button
        type="button"
        onClick={() => formatHeading(1)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => formatHeading(2)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => formatHeading(3)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
      >
        H3
      </button>
      <button
        type="button"
        onClick={formatParagraph}
        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
      >
        Paragraph
      </button>
    </div>
  );
}

// Plugin to handle variable highlighting
function VariableHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerTextContentListener((textContent) => {
      editor.update(() => {
        const root = $getRoot();
        
        // Simple regex to find {{variable}} patterns
        const variableRegex = /\{\{([^}]+)\}\}/g;
        
        // This is a simplified approach - in a real implementation,
        // you'd want to create custom nodes for variables
        // For now, we'll just style them with CSS
      });
    });
  }, [editor]);

  return null;
}

// Function to convert Lexical editor state to our custom format
function convertEditorStateToCustomFormat(editorState: EditorState) {
  interface ChildNode {
    type: string;
    level?: number;
    children: Array<{ type: string; text: string }>;
  }
  
  const lexicalJson = { root: { children: [] as ChildNode[] } };
  const contextMap: Record<string, string> = {};
  const promptMap: Record<string, string> = {};

  editorState.read(() => {
    const root = $getRoot();
    const children = root.getChildren();

    for (const node of children) {
      if ($isHeadingNode(node)) {
        const textContent = node.getTextContent();
        const level = parseInt(node.getTag().replace('h', ''), 10);
        
        lexicalJson.root.children.push({
          type: 'heading',
          level: level,
          children: [{ type: 'text', text: textContent }]
        });

        // Extract variables from text content
        extractVariables(textContent, contextMap, promptMap);
      } else if (node.getType() === 'paragraph') {
        const textContent = node.getTextContent();
        
        lexicalJson.root.children.push({
          type: 'paragraph',
          children: [{ type: 'text', text: textContent }]
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
  while ((match = variableRegex.exec(text)) !== null) {
    const varName = match[1];
    if (!contextMap[varName]) {
      contextMap[varName] = `[${varName}]`; // placeholder value
    }
  }

  // Extract [[prompt]] patterns  
  const promptRegex = /\[\[([^\]]+)\]\]/g;
  while ((match = promptRegex.exec(text)) !== null) {
    const promptName = match[1];
    if (!promptMap[promptName]) {
      promptMap[promptName] = `[${promptName} description]`; // placeholder value
    }
  }
}

interface JsonOutput {
  lexical_json: {
    root: {
      children: Array<{
        type: string;
        level?: number;
        children: Array<{ type: string; text: string }>;
      }>;
    };
  };
  context_map: Record<string, string>;
  prompt_map: Record<string, string>;
}

export function LexicalEditor() {
  const [jsonOutput, setJsonOutput] = useState<JsonOutput | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const initialConfig = {
    namespace: 'WordAIEditor',
    theme,
    nodes: [HeadingNode],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  const onChange = (editorState: EditorState, editor: LexicalEditorType) => {
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
      const response = await fetch('http://localhost:8000/api/save_template/', {
        method: 'POST',
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
        setSaveMessage(`Template "${result.name}" saved successfully with ID: ${result.id}`);
        setTemplateName(''); // Clear the template name after successful save
      } else {
        const error = await response.json();
        setSaveMessage(`Error saving template: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      setSaveMessage(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <LexicalComposer initialConfig={initialConfig}>
          <ToolbarPlugin />
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className="min-h-[400px] p-4 outline-none resize-none overflow-hidden"
                  style={{
                    // Custom CSS for variable highlighting
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                />
              }
              placeholder={
                <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                  Start typing your template... Use {`{{variable}}`} for variables and {`[[prompt]]`} for AI prompts.
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={onChange} />
            <HistoryPlugin />
            <VariableHighlightPlugin />
          </div>
        </LexicalComposer>
      </div>

      {/* Save Template Section */}
      <div className="mt-6 bg-white p-4 rounded-lg border border-gray-300">
        <h3 className="font-bold mb-3">Save Template</h3>
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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              'Save Template'
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