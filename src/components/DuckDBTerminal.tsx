import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useDuckDB } from '@/lib/duckdb/hooks/use-duckdb'
import { cn } from '@/lib/utils'

interface DuckDBTerminalProps {
  sessionId: string
  onReady?: () => void
}

interface QueryResult {
  id: string
  query: string
  result?: any[]
  error?: string
  timestamp: Date
  isLoading?: boolean
}

// Store session-specific state outside component to persist across re-renders
const sessionState = new Map<string, {
  queryHistory: QueryResult[]
  isInitialized: boolean
  currentQuery: string
  historyIndex: number
}>()

const getSessionState = (sessionId: string) => {
  if (!sessionState.has(sessionId)) {
    sessionState.set(sessionId, {
      queryHistory: [],
      isInitialized: false,
      currentQuery: '',
      historyIndex: -1,
    })
  }
  return sessionState.get(sessionId)!
}

export function DuckDBTerminal({ sessionId, onReady }: DuckDBTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const state = getSessionState(sessionId)
  const [query, setQuery] = useState(state.currentQuery)
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>(state.queryHistory)
  const [historyIndex, setHistoryIndex] = useState(state.historyIndex)
  const [isInitialized, setIsInitialized] = useState(state.isInitialized)
  const { db, loading: dbLoading, error: dbError } = useDuckDB({
    id: `duckdb-session-${sessionId}`,
    name: `DuckDB Session ${sessionId}`,
  })

  // Sync local state with session state when sessionId changes
  useEffect(() => {
    const currentState = getSessionState(sessionId)
    setQuery(currentState.currentQuery)
    setQueryHistory(currentState.queryHistory)
    setHistoryIndex(currentState.historyIndex)
    setIsInitialized(currentState.isInitialized)
  }, [sessionId])

  // Update session state when local state changes
  useEffect(() => {
    const currentState = getSessionState(sessionId)
    currentState.currentQuery = query
    currentState.queryHistory = queryHistory
    currentState.historyIndex = historyIndex
    currentState.isInitialized = isInitialized
  }, [sessionId, query, queryHistory, historyIndex, isInitialized])

  useEffect(() => {
    if (db && !isInitialized) {
      setIsInitialized(true)
      onReady?.()

      // Add welcome message only if this session doesn't have history yet
      if (queryHistory.length === 0) {
        const welcomeResult: QueryResult = {
          id: 'welcome',
          query: '-- Welcome to DuckDB Terminal',
          result: [
            { message: `DuckDB Terminal Session: ${sessionId}` },
            { message: 'Available datasets from local AR-IO node:' },
            {
              message:
                "• Blocks: 'http://localhost:4000/local/datasets/blocks/data/height=911404-1094394/blocks.parquet'",
            },
            {
              message:
                "• Tags: 'http://localhost:4000/local/datasets/tags/data/height=911404-1094394/tags.parquet'",
            },
            {
              message:
                "• Transactions: 'http://localhost:4000/local/datasets/transactions/data/height=911404-1094394/transactions.parquet'",
            },
            { message: '' },
            { message: 'Example queries:' },
            {
              message:
                "SELECT COUNT(*) FROM 'http://localhost:4000/local/datasets/blocks/data/height=911404-1094394/blocks.parquet';",
            },
            {
              message:
                "SELECT * FROM 'http://localhost:4000/local/datasets/transactions/data/height=911404-1094394/transactions.parquet' LIMIT 10;",
            },
            { message: '' },
            {
              message:
                'Type your SQL queries below and press Ctrl+Enter to execute.',
            },
          ],
          timestamp: new Date(),
        }
        setQueryHistory([welcomeResult])
      }
    }
  }, [db, isInitialized, sessionId, onReady, queryHistory.length])

  const executeQuery = async () => {
    if (!db || !query.trim()) return

    const queryId = Date.now().toString()
    const newQuery: QueryResult = {
      id: queryId,
      query: query.trim(),
      timestamp: new Date(),
      isLoading: true,
    }

    setQueryHistory((prev) => [...prev, newQuery])
    setQuery('')
    setHistoryIndex(-1)

    try {
      const connection = await db.connect()
      const result = await connection.query(query.trim())
      const rows = result.toArray().map((row) => row.toJSON())

      setQueryHistory((prev) =>
        prev.map((q) =>
          q.id === queryId ? { ...q, result: rows, isLoading: false } : q,
        ),
      )

      await connection.close()
    } catch (error) {
      setQueryHistory((prev) =>
        prev.map((q) =>
          q.id === queryId
            ? {
                ...q,
                error: error instanceof Error ? error.message : 'Unknown error',
                isLoading: false,
              }
            : q,
        ),
      )
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault()
      executeQuery()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const queries = queryHistory
        .filter((q) => q.id !== 'welcome')
        .map((q) => q.query)
      if (queries.length > 0) {
        const newIndex = Math.min(historyIndex + 1, queries.length - 1)
        setHistoryIndex(newIndex)
        setQuery(queries[queries.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const queries = queryHistory
          .filter((q) => q.id !== 'welcome')
          .map((q) => q.query)
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setQuery(queries[queries.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setQuery('')
      }
    }
  }

  const clearHistory = () => {
    setQueryHistory((prev) => prev.filter((q) => q.id === 'welcome'))
  }

  if (dbError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-sm font-medium text-destructive">
            Failed to initialize DuckDB
          </div>
          <div className="text-xs text-muted-foreground">{dbError}</div>
          <button
            className="hover:bg-primary/90 mt-3 rounded bg-primary px-3 py-1 text-xs text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (dbLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-sm">Initializing DuckDB...</div>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-black font-mono text-sm text-green-400">
      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 pb-0 font-mono"
      >
        {queryHistory.map((result) => (
          <div key={result.id} className="mb-4">
            {/* Query */}
            <div className="text-gray-400">
              <span className="text-blue-400">duckdb&gt;</span> {result.query}
            </div>

            {/* Loading */}
            {result.isLoading && (
              <div className="mt-1 text-yellow-400">Executing query...</div>
            )}

            {/* Error */}
            {result.error && (
              <div className="mt-1 text-red-400">Error: {result.error}</div>
            )}

            {/* Results */}
            {result.result && (
              <div className="mt-1">
                {result.id === 'welcome' ? (
                  // Welcome message formatting
                  <div className="text-green-300">
                    {result.result.map((row, i) => (
                      <div
                        key={i}
                        className={cn(
                          row.message.startsWith('•') ? 'text-cyan-400' : '',
                          row.message.startsWith('SELECT')
                            ? 'ml-2 text-yellow-300'
                            : '',
                          row.message === '' ? 'h-2' : '',
                        )}
                      >
                        {row.message}
                      </div>
                    ))}
                  </div>
                ) : result.result.length === 0 ? (
                  <div className="text-gray-400">No results returned.</div>
                ) : (
                  // Table formatting for query results
                  <div className="mt-2">
                    <div className="text-gray-300">
                      Rows: {result.result.length}
                    </div>
                    <div className="mt-1 max-h-64 overflow-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-600">
                            {Object.keys(result.result[0] || {}).map((key) => (
                              <th
                                key={key}
                                className="px-2 py-1 text-left text-cyan-400"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.result.slice(0, 100).map((row, i) => (
                            <tr key={i} className="border-b border-gray-800">
                              {Object.values(row).map((value, j) => (
                                <td
                                  key={j}
                                  className="px-2 py-1 text-green-300"
                                >
                                  {value === null ? (
                                    <span className="text-gray-500">NULL</span>
                                  ) : String(value).length > 50 ? (
                                    String(value).substring(0, 50) + '...'
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {result.result.length > 100 && (
                        <div className="mt-2 text-gray-400">
                          ... and {result.result.length - 100} more rows
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-3">
        <div className="flex items-start gap-2">
          <span className="mt-1 text-blue-400">duckdb&gt;</span>
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter SQL query... (Ctrl+Enter to execute, ↑/↓ for history)"
              className="w-full resize-none bg-transparent font-mono text-green-400 placeholder-gray-500 outline-none"
              rows={Math.max(1, Math.min(5, query.split('\n').length))}
            />
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={executeQuery}
              disabled={!query.trim() || !db}
              className="h-7 px-2 text-xs"
            >
              Run
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearHistory}
              className="h-7 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Ctrl+Enter to execute • ↑/↓ for history • Session: {sessionId}
        </div>
      </div>
    </div>
  )
}
