import { createFileRoute } from '@tanstack/react-router'
import { LexicalEditor } from '../../components/LexicalEditor'

export const Route = createFileRoute('/editor/$templateId')({
  component: TemplateEditor,
})

function TemplateEditor() {
  const { templateId } = Route.useParams()
  console.log('TemplateEditor rendered with templateId:', templateId)
  
  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Edit Template
        </h1>
        <p className="text-gray-600">
          Edit template #{templateId} with AI-powered assistance
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <LexicalEditor templateId={templateId} />
      </div>
    </div>
  )
} 