import type React from 'react'
import { useState, useEffect, useRef } from 'react'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  contentType?: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  content?: string
  uploadDate: Date
}

interface AppSettings {
  creativityLevel: number
  responseLength: 'short' | 'medium' | 'long'
  autoInsert: boolean
  preserveFormatting: boolean
}

export const WordyApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'context' | 'settings'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      type: 'ai',
      content: "Hello! I'm your AI writing assistant. I can help you create content, improve your writing, and maintain consistency with your company documents. What would you like to work on today?",
      timestamp: new Date()
    }
  ])
  const [messageInput, setMessageInput] = useState('')
  const [contentType, setContentType] = useState('general')
  const [isTyping, setIsTyping] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    creativityLevel: 50,
    responseLength: 'medium',
    autoInsert: false,
    preserveFormatting: true
  })
  const [showActionStatus, setShowActionStatus] = useState(false)
  const [actionMessage, setActionMessage] = useState('Content inserted successfully!')
  const [actionType, setActionType] = useState<'success' | 'error'>('success')

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Start document monitoring for @wordy commands every 500ms
    const interval = setInterval(() => {
      monitorForWordyCommands()
    }, 500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  })

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9)
  }

  const formatTime = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    return date.toLocaleDateString()
  }

  const getContentTypePrompt = (type: string): string => {
    const prompts = {
      general: "How can I help you today?",
      email: "I'll help you draft a professional email. What's the purpose?",
      report: "I'll help you create a report section. What topic should we cover?",
      proposal: "I'll help you write a compelling proposal. What are you proposing?",
      summary: "I'll help you create a summary. What content should I summarize?"
    }
    return prompts[type as keyof typeof prompts] || prompts.general
  }

  const getResponsesByType = (contentType: string): string[] => {
    const responses = {
      general: [
        "I'd be happy to help you with that! Could you provide more details about what you're looking for?",
        "That's an interesting topic. Let me help you explore different approaches to this.",
        "I can assist with that. What specific aspect would you like to focus on?"
      ],
      email: [
        "Here's a professional email draft:\n\nSubject: [Your Subject]\n\nDear [Recipient],\n\nI hope this email finds you well. I am writing to...\n\nBest regards,\n[Your name]",
        "I'll help you craft that email. Here's a structured approach:\n\n• Clear subject line\n• Professional greeting\n• Concise main message\n• Call to action\n• Professional closing"
      ],
      report: [
        "For your report section, consider this structure:\n\n1. Executive Summary\n2. Key Findings\n3. Analysis\n4. Recommendations\n5. Conclusion\n\nWould you like me to elaborate on any section?",
        "Here's a comprehensive report outline that addresses your requirements..."
      ],
      proposal: [
        "Your proposal should include:\n\n• Problem Statement\n• Proposed Solution\n• Benefits & ROI\n• Implementation Timeline\n• Budget Considerations\n\nLet me help you develop each section.",
        "I'll help you create a compelling proposal. Here's a strategic approach..."
      ],
      summary: [
        "Here's a concise summary of the key points:\n\n• Main finding 1\n• Main finding 2\n• Main finding 3\n\nConclusion: [Key takeaway]",
        "Let me provide you with a structured summary that captures the essential elements..."
      ]
    }
    return responses[contentType as keyof typeof responses] || responses.general
  }

  const generateMockContent = (context: string): string => {
    const mockResponses = [
      "The quarterly results show a 15% increase in revenue with strong performance across all sectors.",
      "Our strategic initiative has delivered significant value, exceeding initial projections by 23%.",
      "Market analysis indicates favorable conditions for expansion into emerging segments.",
      "The project timeline remains on track with all key milestones achieved as scheduled.",
      "Customer satisfaction scores have improved to 94%, reflecting our commitment to excellence.",
      "Year-over-year growth demonstrates the effectiveness of our operational improvements.",
      "Implementation of new processes has resulted in enhanced efficiency and cost reduction.",
      "Stakeholder feedback confirms alignment with organizational objectives and priorities.",
      "The comprehensive assessment reveals opportunities for continued optimization and growth.",
      "Financial metrics indicate robust performance with sustainable long-term prospects."
    ]
    
    return mockResponses[Math.floor(Math.random() * mockResponses.length)]
  }

  const findWordyCommandEnd = (text: string, wordyIndex: number): number => {
    // Find the end of the @wordy command - look forwards for the first period
    for (let i = wordyIndex; i < text.length; i++) {
      if (text[i] === '.') {
        return i + 1 // Include the period
      }
    }
    return text.length
  }

  const sendMessage = async () => {
    if (!messageInput.trim()) return

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: messageInput,
      timestamp: new Date(),
      contentType
    }

    setMessages(prev => [...prev, userMessage])
    setMessageInput('')
    setIsTyping(true)

    // Simulate AI response delay
    setTimeout(() => {
      const responses = getResponsesByType(contentType)
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: randomResponse,
        timestamp: new Date(),
        contentType
      }

      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)

      // Auto-insert if enabled
      if (settings.autoInsert) {
        setTimeout(() => insertIntoDocument(randomResponse), 1000)
      }
    }, 1500)
  }

  const insertIntoDocument = async (content?: string) => {
    if (!content) return

    try {
      await Word.run(async (context) => {
        const selection = context.document.getSelection()
        selection.insertText(content, Word.InsertLocation.replace)
        await context.sync()
      })

      setActionMessage('Content inserted successfully!')
      setActionType('success')
      setShowActionStatus(true)
      setTimeout(() => setShowActionStatus(false), 3000)
    } catch (error) {
      console.error('Error inserting content:', error)
      setActionMessage('Failed to insert content into document')
      setActionType('error')
      setShowActionStatus(true)
      setTimeout(() => setShowActionStatus(false), 3000)
    }
  }

  const monitorForWordyCommands = async () => {
    try {
      await Word.run(async (context) => {
        const body = context.document.body
        body.load('text')
        await context.sync()

        const text = body.text
        const wordyIndex = text.indexOf('@wordy')
        
        if (wordyIndex !== -1) {
          // Find the end of the @wordy command (up to the period)
          const commandEnd = findWordyCommandEnd(text, wordyIndex)
          const commandText = text.substring(wordyIndex, commandEnd)
          
          // Check if command ends with a period
          if (commandText.trim().endsWith('.')) {
            // Replace only the @wordy command text with mock content
            const mockContent = generateMockContent(commandText)
            
            const range = body.getRange()
            range.load('text')
            await context.sync()
            
            const searchResults = range.search(commandText.trim(), { matchCase: false, matchWholeWord: false })
            searchResults.load('items')
            await context.sync()
            
            if (searchResults.items.length > 0) {
              const foundRange = searchResults.items[0]
              foundRange.insertText(mockContent, Word.InsertLocation.replace)
              
              // Reset formatting to normal (remove any blue highlighting and bold)
              foundRange.font.color = 'black'
              foundRange.font.bold = false
              
              await context.sync()
              
              // Show action status
              setActionMessage('@wordy command executed successfully!')
              setActionType('success')
              setShowActionStatus(true)
              setTimeout(() => setShowActionStatus(false), 3000)
            }
          } else {
            // Highlight @wordy in blue and bold when detected but not ready for replacement
            const searchResults = body.search('@wordy', { matchCase: false, matchWholeWord: false })
            searchResults.load('items')
            await context.sync()
            
            if (searchResults.items.length > 0) {
              for (const item of searchResults.items) {
                item.font.color = 'blue'
                item.font.bold = true
              }
              await context.sync()
            }
          }
        }
      })
    } catch (error) {
      // Silently handle errors - document might not be ready or accessible
    }
  }

  const handleFileUpload = (files: FileList) => {
    for (const file of Array.from(files)) {
      if (isValidFileType(file)) {
        const uploadedFile: UploadedFile = {
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date()
        }
        
        setUploadedFiles(prev => [...prev, uploadedFile])
        
        // Read file content
        const reader = new FileReader()
        reader.onload = (e) => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, content: e.target?.result as string }
                : f
            )
          )
        }
        reader.readAsText(file)
      }
    }
  }

  const isValidFileType = (file: File): boolean => {
    const validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    return validTypes.some(type => file.type.includes(type)) || 
           file.name.endsWith('.txt') || 
           file.name.endsWith('.docx') || 
           file.name.endsWith('.pdf')
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    return '📄'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur">🤖</div>
          <div>
            <h2 className="text-lg font-semibold">Wordy AI Assistant</h2>
            <span className="text-sm opacity-80 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Online • @wordy monitoring active
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-50 border-b border-gray-200 px-5">
        <div className="flex">
          {(['chat', 'context', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-blue-50'
              }`}
            >
              <span className="text-base">
                {tab === 'chat' ? '💬' : tab === 'context' ? '📁' : '⚙️'}
              </span>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Action Status */}
      {showActionStatus && (
        <div className={`p-4 animate-slide-down ${
          actionType === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center gap-3">
            <div className="text-xl animate-bounce">
              {actionType === 'success' ? '✅' : '❌'}
            </div>
            <div className="text-sm font-medium">{actionMessage}</div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Content Type Selector */}
            <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center gap-3">
              <label htmlFor="contentType" className="text-sm font-medium text-gray-700">
                Content Type:
              </label>
              <select
                id="contentType"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General Chat</option>
                <option value="email">Email</option>
                <option value="report">Report Section</option>
                <option value="proposal">Proposal</option>
                <option value="summary">Summary</option>
              </select>
            </div>

            {/* Messages Container */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 p-5 overflow-y-auto bg-gray-50 space-y-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 animate-fade-in ${
                    message.type === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    message.type === 'ai'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.type === 'ai' ? '🤖' : '👤'}
                  </div>
                  <div className={`flex flex-col max-w-[70%] ${
                    message.type === 'user' ? 'items-end' : ''
                  }`}>
                    <div className={`p-3 shadow-sm ${
                      message.type === 'ai'
                        ? 'bg-white text-gray-800 rounded-2xl rounded-bl-md'
                        : 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 px-1 ${
                      message.type === 'user' ? 'text-right' : ''
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                    {message.type === 'ai' && (
                      <button
                        type="button"
                        onClick={() => insertIntoDocument(message.content)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 px-1 text-left"
                      >
                        Insert into document
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                  <div className="flex flex-col max-w-[70%]">
                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md p-3 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white border-t border-gray-200">
              <div className="flex gap-3 items-end p-3 bg-gray-50 border border-gray-200 rounded-3xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getContentTypePrompt(contentType)}
                  className="flex-1 bg-transparent border-none outline-none text-sm resize-none"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Send message">
                    <title>Send message</title>
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22,2 15,22 11,13 2,9" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Context Tab */}
        {activeTab === 'context' && (
          <div className="p-5 h-full overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Context Management</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Upload company documents to help AI generate content that matches your organization's style and tone.
            </p>
            
            {/* Upload Area */}
            <button
              type="button"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer mb-6"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="text-5xl" role="img" aria-label="Document icon">📄</div>
                <h4 className="text-base font-semibold text-gray-900">Upload Documents</h4>
                <p className="text-sm text-gray-600">Drag and drop files here or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".docx,.pdf,.txt"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <span className="px-4 py-2 border border-blue-600 text-blue-600 bg-white rounded-md text-sm font-medium hover:bg-blue-600 hover:text-white transition-colors">
                  Choose Files
                </span>
              </div>
            </button>

            {/* Uploaded Files List */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-3">Context Documents</h4>
              <div className="space-y-2">
                {uploadedFiles.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <span className="text-5xl block mb-3" role="img" aria-label="Empty folder">📭</span>
                    <p>No documents uploaded yet</p>
                  </div>
                ) : (
                  uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="text-xl">{getFileIcon(file.type)}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                        <div className="text-xs text-gray-600">{formatFileSize(file.size)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-5 h-full overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Settings & Preferences</h3>
            
            <div className="mb-8">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">AI Behavior</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <label htmlFor="creativityLevel" className="text-sm text-gray-700 font-medium">Creativity Level:</label>
                  <div className="flex items-center gap-3">
                    <input
                      id="creativityLevel"
                      type="range"
                      min="0"
                      max="100"
                      value={settings.creativityLevel}
                      onChange={(e) => setSettings(prev => ({ ...prev, creativityLevel: Number.parseInt(e.target.value, 10) }))}
                      className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm text-gray-600 font-medium min-w-[40px] text-right">
                      {settings.creativityLevel}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <label htmlFor="responseLength" className="text-sm text-gray-700 font-medium">Response Length:</label>
                  <select
                    id="responseLength"
                    value={settings.responseLength}
                    onChange={(e) => setSettings(prev => ({ ...prev, responseLength: e.target.value as 'short' | 'medium' | 'long' }))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Word Integration</h4>
              <div className="space-y-4">
                <div className="py-3 border-b border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={settings.autoInsert}
                      onChange={(e) => setSettings(prev => ({ ...prev, autoInsert: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded relative transition-all ${
                      settings.autoInsert
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {settings.autoInsert && (
                        <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <title>Checkmark</title>
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    Auto-insert generated content
                  </label>
                </div>
                <div className="py-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={settings.preserveFormatting}
                      onChange={(e) => setSettings(prev => ({ ...prev, preserveFormatting: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded relative transition-all ${
                      settings.preserveFormatting
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {settings.preserveFormatting && (
                        <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <title>Checkmark</title>
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    Preserve document formatting
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">About</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 mb-2"><strong>Version:</strong> 1.0.0</p>
                <p className="text-sm text-gray-700 mb-4"><strong>Build:</strong> 2024.1.0</p>
                <button 
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Check for Updates
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 