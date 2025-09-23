import { useState } from 'react'
import { Settings, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ConsoleSession {
  id: string
  name: string
  type: 'aos'
  processId?: string
  isActive: boolean
}

interface TerminalConfigModalProps {
  session: ConsoleSession
  isOpen: boolean
  onClose: () => void
  onSave: (updatedSession: ConsoleSession) => void
}

export function TerminalConfigModal({ session, isOpen, onClose, onSave }: TerminalConfigModalProps) {
  const [name, setName] = useState(session.name)
  const [processId, setProcessId] = useState(session.processId || '')

  const handleSave = () => {
    onSave({
      ...session,
      name,
      processId: processId.trim() || undefined,
    })
    onClose()
  }

  const handleCancel = () => {
    // Reset to original values
    setName(session.name)
    setProcessId(session.processId || '')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <h2 className="text-lg font-semibold">Terminal Configuration</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter session name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="process-id">Process ID</Label>
            <Input
              id="process-id"
              value={processId}
              onChange={(e) => setProcessId(e.target.value)}
              placeholder="Enter AO process ID"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The AO process ID to connect to for this terminal session
            </p>
          </div>

          <div>
            <Label>Session Type</Label>
            <div className="mt-1 rounded border bg-muted/20 px-3 py-2 text-sm">
              AOS Terminal
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
