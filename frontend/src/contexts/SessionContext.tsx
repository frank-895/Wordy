import React, { createContext, useContext, useEffect, useState } from 'react'

interface SessionContextType {
  sessionId: string
  cleanup: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | null>(null)

interface SessionProviderProps {
  children: React.ReactNode
  templateId: string
}

export function SessionProvider({ children, templateId }: SessionProviderProps) {
  const [sessionId, setSessionId] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Generate session ID when template changes
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
    setIsInitialized(true)
    
    console.log(`Session created: ${newSessionId} for template: ${templateId}`)
  }, [templateId])

  // Cleanup function
  const cleanup = async () => {
    if (!sessionId || !isInitialized) return

    try {
      console.log(`Attempting to cleanup session: ${sessionId}`)
      const response = await fetch(`/api/rag/cleanup/${sessionId}/`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        console.log(`Session cleanup successful: ${sessionId}`)
      } else {
        console.warn(`Session cleanup failed: ${sessionId}`)
      }
    } catch (err) {
      console.warn(`Session cleanup error: ${err}`)
    }
  }

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        console.log(`Component unmounting, cleaning up session: ${sessionId}`)
        cleanup()
      }
    }
  }, [sessionId, isInitialized])

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isInitialized) {
        console.log('Page unloading - session cleanup will be handled by component unmount')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isInitialized])

  const contextValue: SessionContextType = {
    sessionId,
    cleanup
  }

  console.log(`SessionContext: Providing sessionId=${sessionId}, isInitialized=${isInitialized}`)

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
} 