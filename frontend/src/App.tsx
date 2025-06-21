import React from 'react';
import './index.css';
import { LexicalEditor } from './components/LexicalEditor';

// Example data structure as provided by the user
const exampleRequestData = {
  lexical_json: {
    root: {
      children: [
        {
          type: "heading",
          level: 1,
          children: [
            { type: "text", text: "Report for {{user_name}}" }
          ]
        },
        {
          type: "paragraph",
          children: [
            { type: "text", text: "This document was created on {{date}}." }
          ]
        },
        {
          type: "paragraph",
          children: [
            { type: "text", text: "[[summary_prompt]]" }
          ]
        }
      ]
    }
  },
  context_map: {
    user_name: "Dr. Alex Lin",
    date: "2025-06-21",
    project_name: "Cancer detection using AI"
  },
  prompt_map: {
    summary_prompt: "Write a summary of the project called {{project_name}} highlighting the key results."
  }
};

function App() {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [status, setStatus] = React.useState<string>('');

  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    setStatus('Generating document...');

    try {
      const response = await fetch('http://localhost:8000/api/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exampleRequestData),
      });

      if (response.ok) {
        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'generated-document.docx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setStatus('Document generated and downloaded successfully!');
      } else {
        const errorData = await response.json();
        setStatus(`Error: ${errorData.error || 'Failed to generate document'}`);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WordAI Editor
          </h1>
          <p className="text-gray-600">
            A simple rich text editor powered by Lexical
          </p>
        </header>
        
        {/* Example Document Generation Section */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Example Document Generation
          </h2>
          <p className="text-gray-600 mb-4">
            Click the button below to generate an example document using placeholders and AI prompts.
          </p>
          
          <button
            type="button"
            onClick={handleGenerateDocument}
            disabled={isGenerating}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isGenerating
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isGenerating ? 'Generating...' : 'Generate Example Document'}
          </button>
          
          {status && (
            <div className={`mt-4 p-3 rounded-lg ${
              status.includes('Error') 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}>
              {status}
            </div>
          )}
          
          {/* Show the example data structure */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
              Show example request data
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
              {JSON.stringify(exampleRequestData, null, 2)}
            </pre>
          </details>
        </div>
        
        <main>
          <LexicalEditor />
        </main>
      </div>
    </div>
  );
}

export default App; 