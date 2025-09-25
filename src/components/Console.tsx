import { useState } from 'react'

import {
  ChevronDown,
  ChevronUp,
  Database,
  Plus,
  Settings,
  Terminal,
  X,
} from 'lucide-react'

import { AOSTerminal } from '@/components/AOSTerminal'
import { DuckDBTerminal } from '@/components/DuckDBTerminal'
import { TerminalConfigModal } from '@/components/TerminalConfigModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ConsoleSession {
  id: string
  name: string
  type: 'aos' | 'duckdb'
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
  const [activeTab, setActiveTab] = useState<'console' | 'duckdb'>('console')
  const [activeAOSSessionId, setActiveAOSSessionId] = useState('1')
  const [activeDuckDBSessionId, setActiveDuckDBSessionId] = useState<
    string | null
  >(null)
  const [isDragging, setIsDragging] = useState(false)
  const [configModalSession, setConfigModalSession] =
    useState<ConsoleSession | null>(null)

  // Get the active session based on current tab
  const activeSessionId =
    activeTab === 'console' ? activeAOSSessionId : activeDuckDBSessionId
  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const startY = e.clientY
    const startHeight = height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY
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

  const createNewSession = (type: 'aos' | 'duckdb' = 'aos') => {
    const newId = Date.now().toString()
    const sessionCount = sessions.filter((s) => s.type === type).length + 1
    const newSession: ConsoleSession = {
      id: newId,
      name:
        type === 'aos'
          ? `AOS Terminal ${sessionCount}`
          : `DuckDB ${sessionCount}`,
      type,
      isActive: false,
    }
    setSessions([...sessions, newSession])

    // Set the appropriate active session ID based on type
    if (type === 'duckdb') {
      setActiveDuckDBSessionId(newId)
      setActiveTab('duckdb')
    } else {
      setActiveAOSSessionId(newId)
      setActiveTab('console')
    }
  }

  const closeSession = (sessionId: string) => {
    const sessionToClose = sessions.find((s) => s.id === sessionId)
    const newSessions = sessions.filter((s) => s.id !== sessionId)
    setSessions(newSessions)

    // Handle active session updates based on session type
    if (sessionToClose?.type === 'aos' && activeAOSSessionId === sessionId) {
      const remainingAOSSessions = newSessions.filter((s) => s.type === 'aos')
      if (remainingAOSSessions.length > 0) {
        setActiveAOSSessionId(remainingAOSSessions[0].id)
      }
    } else if (
      sessionToClose?.type === 'duckdb' &&
      activeDuckDBSessionId === sessionId
    ) {
      const remainingDuckDBSessions = newSessions.filter(
        (s) => s.type === 'duckdb',
      )
      if (remainingDuckDBSessions.length > 0) {
        setActiveDuckDBSessionId(remainingDuckDBSessions[0].id)
      } else {
        setActiveDuckDBSessionId(null)
      }
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

  const selectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (session?.type === 'aos') {
      setActiveAOSSessionId(sessionId)
    } else if (session?.type === 'duckdb') {
      setActiveDuckDBSessionId(sessionId)
    }
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
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as 'console' | 'duckdb')
            }
            className="h-full"
          >
            {/* Console Header */}
            <div className="bg-muted/30 flex h-10 items-center justify-between border-b pr-2">
              <div className="flex items-center gap-2">
                <TabsList className="h-8 bg-transparent p-0">
                  <TabsTrigger
                    value="console"
                    className="h-8 rounded-none border-r px-3 text-xs data-[state=active]:bg-background"
                  >
                    <Terminal className="mr-1 h-3 w-3" />
                    AOS
                  </TabsTrigger>
                  <TabsTrigger
                    value="duckdb"
                    className="h-8 rounded-none border-r px-3 text-xs data-[state=active]:bg-background"
                  >
                    <Database className="mr-1 h-3 w-3" />
                    DuckDB
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() =>
                    createNewSession(activeTab === 'duckdb' ? 'duckdb' : 'aos')
                  }
                  title={`New ${activeTab === 'duckdb' ? 'DuckDB' : 'AOS'} Terminal`}
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
                  {activeSession && activeSession.type === 'aos' && (
                    <div className="h-full">
                      <AOSTerminal sessionProcessId={activeSession.processId} />
                    </div>
                  )}
                </div>

                {/* Right Panel - Session List */}
                <div className="bg-muted/20 w-48 border-l p-3">
                  <div className="mb-3">
                    <h3 className="mb-2 text-sm font-medium">AOS Sessions</h3>
                    <div className="space-y-1">
                      {sessions
                        .filter((s) => s.type === 'aos')
                        .map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              'hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded p-2 text-xs',
                              activeSessionId === session.id && 'bg-muted',
                            )}
                            onClick={() => selectSession(session.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openConfigModal(session)
                                }}
                                title="Configure Session"
                              >
                                <Settings className="h-3 w-3" />
                              </div>
                              <span className="truncate">{session.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div
                                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  closeSession(session.id)
                                }}
                                title="Delete Session"
                              >
                                <X className="h-3 w-3" />
                              </div>
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
                    onClick={() => createNewSession('aos')}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    New AOS Session
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* DuckDB Tab Content */}
            <TabsContent value="duckdb" className="m-0 h-[calc(100%-2rem)] p-0">
              <div className="flex h-full">
                {/* Terminal Content */}
                <div className="flex-1">
                  {activeSession && activeSession.type === 'duckdb' && (
                    <div className="h-full">
                      <DuckDBTerminal sessionId={activeSession.id} />
                    </div>
                  )}
                </div>

                {/* Right Panel - Session List */}
                <div className="bg-muted/20 w-48 border-l p-3">
                  <div className="mb-3">
                    <h3 className="mb-2 text-sm font-medium">
                      DuckDB Sessions
                    </h3>
                    <div className="space-y-1">
                      {sessions
                        .filter((s) => s.type === 'duckdb')
                        .map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              'hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded p-2 text-xs',
                              activeSessionId === session.id && 'bg-muted',
                            )}
                            onClick={() => selectSession(session.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openConfigModal(session)
                                }}
                                title="Configure Session"
                              >
                                <Settings className="h-3 w-3" />
                              </div>
                              <span className="truncate">{session.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div
                                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded hover:bg-muted"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  closeSession(session.id)
                                }}
                                title="Delete Session"
                              >
                                <X className="h-3 w-3" />
                              </div>
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
                    onClick={() => createNewSession('duckdb')}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    New DuckDB Session
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
