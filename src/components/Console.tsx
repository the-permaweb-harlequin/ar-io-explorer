import { useState } from 'react'

import {
  ChevronDown,
  ChevronUp,
  Plus,
  Settings,
  Terminal,
  X,
} from 'lucide-react'

import { AOSTerminal } from '@/components/AOSTerminal'
import { TerminalConfigModal } from '@/components/TerminalConfigModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ConsoleSession {
  id: string
  name: string
  type: 'aos'
  processId?: string
  isActive: boolean
}

interface ConsoleProps {
  isOpen: boolean
  onToggle: () => void
  height?: number
  onHeightChange?: (height: number) => void
}

export function Console({
  isOpen,
  onToggle,
  height = 300,
  onHeightChange,
}: ConsoleProps) {
  const [sessions, setSessions] = useState<ConsoleSession[]>([
    { id: '1', name: 'AOS Terminal 1', type: 'aos', isActive: true },
  ])
  const [activeSessionId, setActiveSessionId] = useState('1')
  const [isDragging, setIsDragging] = useState(false)
  const [configModalSession, setConfigModalSession] =
    useState<ConsoleSession | null>(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const startY = e.clientY
    const startHeight = height

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY - e.clientY
      const newHeight = Math.max(200, Math.min(800, startHeight + deltaY))
      onHeightChange?.(newHeight)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const createNewSession = () => {
    const newId = Date.now().toString()
    const newSession: ConsoleSession = {
      id: newId,
      name: `AOS Terminal ${sessions.length + 1}`,
      type: 'aos',
      isActive: false,
    }
    setSessions([...sessions, newSession])
    setActiveSessionId(newId)
  }

  const closeSession = (sessionId: string) => {
    const newSessions = sessions.filter((s) => s.id !== sessionId)
    setSessions(newSessions)

    if (activeSessionId === sessionId && newSessions.length > 0) {
      setActiveSessionId(newSessions[0].id)
    }
  }

  const openConfigModal = (session: ConsoleSession) => {
    setConfigModalSession(session)
  }

  const closeConfigModal = () => {
    setConfigModalSession(null)
  }

  const saveSessionConfig = (updatedSession: ConsoleSession) => {
    setSessions(
      sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
    )
  }

  if (!isOpen) {
    return null
  }

  return (
    // eslint-disable-next-line no-restricted-syntax
    <div className="border-t bg-background" style={{ height: `${height}px` }}>
      {/* Resize Handle */}
      <div
        className={cn(
          'hover:bg-border/80 h-1 w-full cursor-row-resize bg-border transition-colors',
          isDragging && 'bg-primary',
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Console Content */}
      <div className="flex h-[calc(100%-2.5rem)]">
        {/* Main Console Tabs */}
        <div className="flex-1">
          <Tabs defaultValue="console" className="h-full">
            {/* Console Header */}
            <div className="bg-muted/30 flex h-10 items-center justify-between border-b pr-2">
              <div className="flex items-center gap-2">
                <TabsList className="h-8 bg-transparent p-0">
                  <TabsTrigger
                    value="console"
                    className="h-8 rounded-none border-r px-3 text-xs data-[state=active]:bg-background"
                  >
                    <Terminal className="mr-1 h-3 w-3" />
                    Console
                  </TabsTrigger>
                  {/* Future tabs: Crons, Gateway, etc. */}
                </TabsList>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={createNewSession}
                  title="New Terminal"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onToggle}
                  title={isOpen ? 'Hide Console' : 'Show Console'}
                >
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Console Tab Content */}
            <TabsContent
              value="console"
              className="m-0 h-[calc(100%-2rem)] p-0"
            >
              <div className="flex h-full">
                {/* Terminal Content */}
                <div className="flex-1">
                  {activeSession && (
                    <div className="h-full">
                      <AOSTerminal sessionProcessId={activeSession.processId} />
                    </div>
                  )}
                </div>

                {/* Right Panel - Session List */}
                <div className="bg-muted/20 w-48 border-l p-3">
                  <div className="mb-3">
                    <h3 className="mb-2 text-sm font-medium">
                      Terminal Sessions
                    </h3>
                    <div className="space-y-1">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            'hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded p-2 text-xs',
                            activeSessionId === session.id && 'bg-muted',
                          )}
                          onClick={() => setActiveSessionId(session.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                openConfigModal(session)
                              }}
                              title="Configure Session"
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <span className="truncate">{session.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                closeSession(session.id)
                              }}
                              title="Delete Session"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <div
                              className={cn(
                                'h-2 w-2 rounded-full',
                                session.isActive
                                  ? 'bg-green-500'
                                  : 'bg-gray-400',
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={createNewSession}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    New Session
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Configuration Modal */}
      {configModalSession && (
        <TerminalConfigModal
          session={configModalSession}
          isOpen={!!configModalSession}
          onClose={closeConfigModal}
          onSave={saveSessionConfig}
        />
      )}
    </div>
  )
}
