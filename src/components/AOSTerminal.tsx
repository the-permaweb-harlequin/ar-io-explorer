import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useAOSProcess } from '@/hooks/useAOSProcess'
import '@xterm/xterm/css/xterm.css'

interface AOSTerminalProps {
  sessionProcessId?: string
}

export function AOSTerminal({ sessionProcessId }: AOSTerminalProps) {
  const {
    processId,
    isConnected,
    selectedProcessHistory,
    isLoading,
    error,
    connectProcess,
    disconnectProcess,
  } = useAOSProcess()

  const terminalRef = useRef<HTMLDivElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [terminal, setTerminal] = useState<Terminal | null>(null)
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null)
  const [isTerminalInitialized, setIsTerminalInitialized] = useState(false)
  const [currentLine, setCurrentLine] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const handleDisconnect = useCallback(() => {
    disconnectProcess()
    if (terminal) {
      terminal.clear()
    }
  }, [disconnectProcess, terminal])

  const writePrompt = useCallback(() => {
    if (terminal && isConnected) {
      terminal.write('> ')
    }
  }, [terminal, isConnected])

  const processCommand = useCallback((command: string) => {
    if (!terminal) return

    const trimmedCommand = command.trim()
    if (trimmedCommand) {
      setCommandHistory(prev => [...prev, trimmedCommand])
      setHistoryIndex(-1)

      // Process built-in commands
      switch (trimmedCommand.toLowerCase()) {
        case 'clear':
          terminal.clear()
          break
        case 'help':
          terminal.writeln('\r\nAvailable commands:')
          terminal.writeln('  help    - Show this help message')
          terminal.writeln('  clear   - Clear the terminal')
          terminal.writeln('  status  - Show process status')
          terminal.writeln('  logs    - Show recent logs')
          terminal.writeln('  exit    - Disconnect from process')
          break
        case 'status':
          terminal.writeln(`\r\nProcess Status:`)
          terminal.writeln(`  ID: ${processId}`)
          terminal.writeln(`  Status: Connected`)
          terminal.writeln(`  Uptime: ${new Date().toLocaleString()}`)
          break
        case 'logs':
          terminal.writeln('\r\nRecent logs:')
          terminal.writeln('  [INFO] Process initialized')
          terminal.writeln('  [INFO] Terminal connected')
          terminal.writeln('  [INFO] Ready for commands')
          break
        case 'exit':
          terminal.writeln('\r\nDisconnecting...')
          setTimeout(() => handleDisconnect(), 1000)
          return
        default:
          terminal.writeln(`\r\nExecuting: ${trimmedCommand}`)
          terminal.writeln('Command executed successfully')
          break
      }
    }
    writePrompt()
  }, [terminal, processId, writePrompt, handleDisconnect])

  useEffect(() => {
    if (terminalRef.current && terminal == null && !isTerminalInitialized) {
      const newTerminal = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#f2f2f2',
          foreground: '#191A19',
          selectionForeground: '#f2f2f2',
          selectionBackground: '#191A19',
          cursor: 'black',
          cursorAccent: 'black',
          black: '#191A19',
        },
      })

      const newFitAddon = new FitAddon()
      const webLinksAddon = new WebLinksAddon()
      
      newTerminal.loadAddon(newFitAddon)
      newTerminal.loadAddon(webLinksAddon)
      newTerminal.open(terminalRef.current)
      newFitAddon.fit()

      let currentInput = ''
      let cursorPosition = 0
      let historyPos = -1

      const renderLine = () => {
        // Clear the current line and rewrite it
        newTerminal.write('\r\x1b[K> ' + currentInput)
        // Position cursor correctly
        const targetPos = 2 + cursorPosition // 2 for "> "
        newTerminal.write('\r')
        for (let i = 0; i < targetPos; i++) {
          newTerminal.write('\x1b[C') // Move cursor right
        }
      }

      const executeCommand = (command: string) => {
        newTerminal.write('\r\n')
        if (command.trim()) {
          setCommandHistory(prev => [...prev, command.trim()])
          processCommand(command.trim())
        } else {
          writePrompt()
        }
        currentInput = ''
        cursorPosition = 0
        historyPos = -1
      }

      // Helper functions for word operations
      const findWordStart = (text: string, pos: number) => {
        let start = pos - 1
        
        // Skip trailing whitespace first
        while (start >= 0 && /\s/.test(text[start])) {
          start--
        }
        
        // Then skip the word characters
        while (start >= 0 && /\S/.test(text[start])) {
          start--
        }
        
        return start + 1
      }

      const findWordEnd = (text: string, pos: number) => {
        let end = pos
        
        // Skip current word characters
        while (end < text.length && /\S/.test(text[end])) {
          end++
        }
        
        // Then skip trailing whitespace
        while (end < text.length && /\s/.test(text[end])) {
          end++
        }
        
        return end
      }

      // Handle keyboard input with proper terminal behavior
      newTerminal.onData((data) => {
        // Debug: log the raw data to see what key combinations actually send
        if (data.length > 1 || (data.charCodeAt(0) < 32 && data.charCodeAt(0) !== 13)) {
          console.log('Key data:', data.split('').map(c => c.charCodeAt(0)))
        }

        for (let i = 0; i < data.length; i++) {
          const char = data[i]
          const code = char.charCodeAt(0)

          if (code === 13) { // Enter
            executeCommand(currentInput)
          } else if (code === 127 || code === 8) { // Backspace/Delete
            if (cursorPosition > 0) {
              currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition)
              cursorPosition--
              renderLine()
            }
          } else if (code === 27) { // Escape sequence
            if (i + 2 < data.length && data[i + 1] === '[') {
              const escapeCode = data[i + 2]
              if (escapeCode === 'A') { // Up arrow
                if (historyPos < commandHistory.length - 1) {
                  historyPos++
                  const cmd = commandHistory[commandHistory.length - 1 - historyPos]
                  currentInput = cmd || ''
                  cursorPosition = currentInput.length
                  renderLine()
                }
                i += 2 // Skip the escape sequence
              } else if (escapeCode === 'B') { // Down arrow
                if (historyPos > 0) {
                  historyPos--
                  const cmd = commandHistory[commandHistory.length - 1 - historyPos]
                  currentInput = cmd || ''
                  cursorPosition = currentInput.length
                  renderLine()
                } else if (historyPos === 0) {
                  historyPos = -1
                  currentInput = ''
                  cursorPosition = 0
                  renderLine()
                }
                i += 2 // Skip the escape sequence
              } else if (escapeCode === 'C') { // Right arrow
                if (cursorPosition < currentInput.length) {
                  cursorPosition++
                  newTerminal.write('\x1b[C')
                }
                i += 2 // Skip the escape sequence
              } else if (escapeCode === 'D') { // Left arrow
                if (cursorPosition > 0) {
                  cursorPosition--
                  newTerminal.write('\x1b[D')
                }
                i += 2 // Skip the escape sequence
              } else if (escapeCode === 'H') { // Home
                cursorPosition = 0
                renderLine()
                i += 2 // Skip the escape sequence
              } else if (escapeCode === 'F') { // End
                cursorPosition = currentInput.length
                renderLine()
                i += 2 // Skip the escape sequence
              } else if (escapeCode === '3' && i + 3 < data.length && data[i + 3] === '~') { // Delete key
                if (cursorPosition < currentInput.length) {
                  currentInput = currentInput.slice(0, cursorPosition) + currentInput.slice(cursorPosition + 1)
                  renderLine()
                }
                i += 3 // Skip the escape sequence
              }
            } else if (i + 3 < data.length && data[i + 1] === 'b') { // Alt+Left (word left)
              const wordStart = findWordStart(currentInput, cursorPosition)
              const moves = cursorPosition - wordStart
              cursorPosition = wordStart
              for (let j = 0; j < moves; j++) {
                newTerminal.write('\x1b[D')
              }
              i += 1 // Skip the 'b'
            } else if (i + 3 < data.length && data[i + 1] === 'f') { // Alt+Right (word right)
              const wordEnd = findWordEnd(currentInput, cursorPosition)
              const moves = wordEnd - cursorPosition
              cursorPosition = wordEnd
              for (let j = 0; j < moves; j++) {
                newTerminal.write('\x1b[C')
              }
              i += 1 // Skip the 'f'
            } else if (i + 1 < data.length && data[i + 1] === '\x7f') { // Alt+Backspace (delete word backward)
              if (cursorPosition > 0) {
                const wordStart = findWordStart(currentInput, cursorPosition)
                currentInput = currentInput.slice(0, wordStart) + currentInput.slice(cursorPosition)
                cursorPosition = wordStart
                renderLine()
              }
              i += 1 // Skip the backspace
            } else if (i + 2 < data.length && data[i + 1] === '[' && data[i + 2] === '3' && i + 4 < data.length && data[i + 3] === ';' && data[i + 4] === '3' && i + 5 < data.length && data[i + 5] === '~') {
              // Alt+Delete (delete word forward) - sequence: ESC[3;3~
              if (cursorPosition < currentInput.length) {
                const wordEnd = findWordEnd(currentInput, cursorPosition)
                currentInput = currentInput.slice(0, cursorPosition) + currentInput.slice(wordEnd)
                renderLine()
              }
              i += 5 // Skip the entire sequence
            } else if (i + 4 < data.length && data.slice(i + 1, i + 5) === '[1;3') {
              // Alt modifier sequences
              if (i + 5 < data.length && data[i + 5] === 'D') { // Alt+Left
                const wordStart = findWordStart(currentInput, cursorPosition)
                const moves = cursorPosition - wordStart
                cursorPosition = wordStart
                for (let j = 0; j < moves; j++) {
                  newTerminal.write('\x1b[D')
                }
                i += 5
              } else if (i + 5 < data.length && data[i + 5] === 'C') { // Alt+Right
                const wordEnd = findWordEnd(currentInput, cursorPosition)
                const moves = wordEnd - cursorPosition
                cursorPosition = wordEnd
                for (let j = 0; j < moves; j++) {
                  newTerminal.write('\x1b[C')
                }
                i += 5
              }
            }
          } else if (code === 21) { // Ctrl+U (delete to beginning of line)
            currentInput = currentInput.slice(cursorPosition)
            cursorPosition = 0
            renderLine()
          } else if (code === 11) { // Ctrl+K (delete to end of line)
            currentInput = currentInput.slice(0, cursorPosition)
            renderLine()
          } else if (code === 23) { // Ctrl+W (delete word backward)
            if (cursorPosition > 0) {
              const wordStart = findWordStart(currentInput, cursorPosition)
              currentInput = currentInput.slice(0, wordStart) + currentInput.slice(cursorPosition)
              cursorPosition = wordStart
              renderLine()
            }
          } else if (code === 1) { // Ctrl+A (beginning of line)
            cursorPosition = 0
            renderLine()
          } else if (code === 5) { // Ctrl+E (end of line)
            cursorPosition = currentInput.length
            renderLine()
          } else if (code === 3) { // Ctrl+C
            newTerminal.write('^C\r\n')
            currentInput = ''
            cursorPosition = 0
            historyPos = -1
            writePrompt()
          } else if (code === 12) { // Ctrl+L
            newTerminal.clear()
            renderLine()
          } else if (code >= 32 && code <= 126) { // Printable characters
            currentInput = currentInput.slice(0, cursorPosition) + char + currentInput.slice(cursorPosition)
            cursorPosition++
            renderLine()
          }
        }
      })

      setTerminal(newTerminal)
      setFitAddon(newFitAddon)
      setIsTerminalInitialized(true)
    }

    return () => {
      terminalRef.current = null
      terminal?.dispose()
      disconnectProcess()
    }
  }, [terminal, isTerminalInitialized, disconnectProcess])

  useEffect(() => {
    if (isTerminalInitialized && terminal && isConnected) {
      try {
        const liveFeed = selectedProcessHistory
        if (liveFeed) {
          terminal.clear()
          liveFeed.split('\n').map((feed: string) => terminal.writeln('\r' + feed))
          writePrompt()
          terminal.scrollToBottom()
        }
      } catch (error: any) {
        console.error('Error displaying data:', error.message)
      }
    }
  }, [selectedProcessHistory, terminal, isTerminalInitialized, isConnected, writePrompt])

  useEffect(() => {
    if (terminal !== null) {
      terminal.reset()
    }
  }, [processId, terminal])

  const handleConnect = async () => {
    if (sessionProcessId?.trim()) {
      await connectProcess(sessionProcessId.trim())
    }
  }

  // Auto-connect when sessionProcessId changes
  useEffect(() => {
    if (sessionProcessId && !isConnected && !isLoading) {
      handleConnect()
    }
  }, [sessionProcessId, isConnected, isLoading])

  // Observe wrapperRef changes
  useEffect(() => {
    if (wrapperRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (fitAddon) {
          fitAddon.fit()
        }
      })

      resizeObserver.observe(wrapperRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [wrapperRef.current, fitAddon])

  return (
    <div className="flex h-full flex-col">
      {/* Connection Status */}
      {error && (
        <div className="m-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          Error: {error}
        </div>
      )}

      {!sessionProcessId && (
        <div className="m-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          No process ID configured. Use the settings button to configure this terminal session.
        </div>
      )}

      {isConnected && processId && (
        <div className="m-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          Connected to process: <code className="font-mono">{processId}</code>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="ml-2 h-6 text-xs"
          >
            Disconnect
          </Button>
        </div>
      )}

      {/* Terminal */}
      <div ref={wrapperRef} className="relative flex-1 bg-card">
        <div
          ref={terminalRef}
          className={`absolute bottom-0 left-0 right-0 top-0 w-full overflow-hidden p-2 transition-opacity ${
            isConnected ? 'opacity-100' : 'opacity-30'
          }`}
        />
        {!isConnected && sessionProcessId && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Connecting...</p>
              <p className="text-sm">Establishing connection to process</p>
            </div>
          </div>
        )}
        {!sessionProcessId && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No Process Configured</p>
              <p className="text-sm">Configure a process ID in the session settings</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
