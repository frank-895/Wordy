import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import { ContextManager } from '../../components/ContextManager'
import { SessionProvider, useSession } from '../../contexts/SessionContext'

export const Route = createFileRoute('/templates/$templateId')({
  component: TemplateFormWrapper,
})

function TemplateFormWrapper() {
  const { templateId } = Route.useParams()
  
  return (
    <SessionProvider templateId={templateId}>
      <TemplateForm />
    </SessionProvider>
  )
}

interface FormFields {
  placeholders: string[];
}

function TemplateForm() {
  const { templateId } = Route.useParams()
  const navigate = useNavigate()
  const { sessionId, cleanup } = useSession()
  const [formFields, setFormFields] = useState<FormFields | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [generating, setGenerating] = useState<boolean>(false)
  const [generateMessage, setGenerateMessage] = useState<string>('')
  
  // Form state for user inputs
  const [contextMap, setContextMap] = useState<Record<string, string>>({})

  // Debug logging
  useEffect(() => {
    console.log(`TemplateForm: sessionId = ${sessionId}`)
  }, [sessionId])

  const fetchFormFields = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/template/${templateId}/fields/`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Template not found')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: FormFields = await response.json()
      setFormFields(data)
      
      // Initialize form state with empty values
      const initialContext: Record<string, string> = {}
      
      for (const placeholder of data.placeholders) {
        initialContext[placeholder] = ''
      }
      
      setContextMap(initialContext)
      
    } catch (err) {
      setError(`Failed to fetch template fields: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    fetchFormFields()
  }, [fetchFormFields])

  const handleContextChange = (key: string, value: string) => {
    setContextMap(prev => ({ ...prev, [key]: value }))
  }

  const validateForm = (): boolean => {
    // Check if all required fields are filled
    const emptyPlaceholders = formFields?.placeholders.filter(p => !contextMap[p]?.trim()) || []
    
    if (emptyPlaceholders.length > 0) {
      setGenerateMessage('Please fill in all fields before generating the document.')
      return false
    }
    
    return true
  }

  const handleGenerateDocument = async () => {
    if (!validateForm()) return

    setGenerating(true)
    setGenerateMessage('')

    try {
      const response = await fetch('/api/template/generate_doc/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          context_map: contextMap,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate document')
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `template_${templateId}_output.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setGenerateMessage('Document generated and downloaded successfully!')
      
      // Cleanup collateral material after successful generation
      console.log('Document generated successfully, calling cleanup...')
      await cleanup()
      console.log('Cleanup completed')
      
    } catch (err) {
      setGenerateMessage(`Error generating document: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={fetchFormFields}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/templates' })}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Templates
          </button>
        </div>
      </div>
    )
  }

  if (!formFields) {
    return null
  }

  const hasFields = formFields.placeholders.length > 0

  return (
    <div className="py-4">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={() => navigate({ to: '/templates' })}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Templates
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Fill Template #{templateId}
        </h1>
        <p className="text-gray-600">
          Fill in the variables below to generate your document
        </p>
      </div>

      {!hasFields ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Document icon">
              <title>Document</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No variables found</h3>
          <p className="text-gray-600 mb-4">
            This template doesn't have any variables to fill
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Variables Section */}
          {formFields.placeholders.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Variables ({formFields.placeholders.length})
              </h2>
              <div className="space-y-4">
                {formFields.placeholders.map((placeholder) => (
                  <div key={placeholder}>
                    <label 
                      htmlFor={`var-${placeholder}`}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {placeholder} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id={`var-${placeholder}`}
                      type="text"
                      value={contextMap[placeholder] || ''}
                      onChange={(e) => handleContextChange(placeholder, e.target.value)}
                      placeholder={`Enter value for ${placeholder}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context Management Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Context Documents
            </h2>
            <p className="text-gray-600 mb-4">
              Associate collateral material with this template to provide context for AI-generated content
            </p>
            <ContextManager templateId={templateId} sessionId={sessionId} />
          </div>

          {/* Generate Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Document</h2>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                Click the button below to generate your document with the filled variables and associated context
              </p>
              <button
                type="button"
                onClick={handleGenerateDocument}
                disabled={generating}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <title>Download</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Document
                  </>
                )}
              </button>
            </div>
            
            {generateMessage && (
              <div className={`mt-4 p-3 rounded-md text-sm ${
                generateMessage.includes('Error') 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {generateMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 