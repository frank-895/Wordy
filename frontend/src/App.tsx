import React from 'react';
import './index.css';
import { LexicalEditor } from './components/LexicalEditor';

function App() {
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
        
        <main>
          <LexicalEditor />
        </main>
      </div>
    </div>
  );
}

export default App; 