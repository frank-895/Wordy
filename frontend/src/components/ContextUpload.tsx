import React, { useState, useRef } from 'react'

interface ContextUploadProps {
  onUploadSuccess: () => void
  templateId: string
  sessionId?: string
}

export function ContextUpload({ onUploadSuccess, templateId, sessionId }: ContextUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    setUploadMessage('')
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      formData.append('template_id', templateId)
      if (sessionId) {
        formData.append('session_id', sessionId)
      }

      const response = await fetch('/api/rag/upload/', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setUploadMessage(`Context document "${result.name}" uploaded and associated with template successfully!`)
      onUploadSuccess()
      
      // Clear message after 3 seconds
      setTimeout(() => setUploadMessage(''), 3000)
    } catch (err) {
      setUploadError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleTextUpload = async (content: string, name: string) => {
    setIsUploading(true)
    setUploadMessage('')
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('content', content)
      formData.append('name', name)
      formData.append('template_id', templateId)
      if (sessionId) {
        formData.append('session_id', sessionId)
      }

      const response = await fetch('/api/rag/upload/', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setUploadMessage(`Context document "${result.name}" uploaded and associated with template successfully!`)
      onUploadSuccess()
      
      // Clear message after 3 seconds
      setTimeout(() => setUploadMessage(''), 3000)
    } catch (err) {
      setUploadError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Messages */}
      {uploadMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong className="font-bold">Success: </strong>
          <span>{uploadMessage}</span>
        </div>
      )}
      
      {uploadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{uploadError}</span>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-gray-400">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? 'Uploading...' : 'Upload Context Document'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Drag and drop a PDF, DOCX, or text file here, or click to browse
            </p>
          </div>

          <button
            type="button"
            onClick={openFileDialog}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </div>
            ) : (
              'Choose File'
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Supported Formats */}
      <div className="text-xs text-gray-500 text-center">
        Supported formats: PDF, DOCX, TXT (max 10MB)
      </div>
    </div>
  )
} 