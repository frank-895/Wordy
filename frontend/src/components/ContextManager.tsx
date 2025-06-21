import React, { useState, useEffect, useCallback } from 'react'
import { ContextUpload } from './ContextUpload'

interface ContextDocument {
  id: string
  name: string
  file_type: string
  template_id: string
  session_id: string
  created_at: string
}

interface ContextManagerProps {
  templateId: string
  sessionId?: string
}

export function ContextManager({ templateId, sessionId }: ContextManagerProps) {
  const [contextDocuments, setContextDocuments] = useState<ContextDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Fetch context documents for this template
  const fetchContextDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/rag/list/?template_id=${templateId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setContextDocuments(data.documents || [])
    } catch (err) {
      setError(`Failed to fetch context documents: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [templateId])

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      await fetchContextDocuments()
      setLoading(false)
    }
    loadData()
  }, [fetchContextDocuments])

  // Handle upload success
  const handleUploadSuccess = useCallback(() => {
    fetchContextDocuments()
  }, [fetchContextDocuments])

  // Delete context document
  const deleteContext = async (documentId: string) => {
    try {
      const response = await fetch(`/api/rag/delete/${documentId}/`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete context document')
      }

      await fetchContextDocuments()
    } catch (err) {
      setError(`Failed to delete context document: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
      case 'docx':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading context documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message Only */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Always show Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Upload Context Document
        </h3>
        <ContextUpload 
          onUploadSuccess={handleUploadSuccess} 
          templateId={templateId}
          sessionId={sessionId}
        />
      </div>

      {/* Context Documents List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Context Documents ({contextDocuments.length})
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Documents uploaded for this template will be used as context during document generation
        </p>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {contextDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No context documents uploaded</p>
              <p className="text-sm">Upload documents above to provide context for this template</p>
            </div>
          ) : (
            contextDocuments.map((document) => (
              <div
                key={document.id}
                className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getFileTypeIcon(document.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {document.file_type.toUpperCase()} • {new Date(document.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteContext(document.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                    title="Delete context document"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 