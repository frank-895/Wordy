import { createFileRoute } from '@tanstack/react-router'
import { LexicalEditor } from '../components/LexicalEditor'

export const Route = createFileRoute('/editor')({
  component: Editor,
})

function Editor() {
  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Document Editor
        </h1>
        <p className="text-gray-600">
          Create and edit your documents with AI-powered assistance
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <LexicalEditor />
      </div>
    </div>
  )
} 