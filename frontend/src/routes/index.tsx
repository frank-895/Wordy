import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to WordAI
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your intelligent document creation assistant
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Smart Editor
          </h2>
          <p className="text-gray-600 mb-4">
            Create documents with our intelligent Lexical-based editor that provides 
            real-time assistance and formatting suggestions.
          </p>
          <a 
            href="/editor" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Writing
          </a>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            AI-Powered Features
          </h2>
          <ul className="text-gray-600 space-y-2">
            <li>• Intelligent content suggestions</li>
            <li>• Document structure optimization</li>
            <li>• Real-time grammar and style checking</li>
            <li>• Template generation</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 