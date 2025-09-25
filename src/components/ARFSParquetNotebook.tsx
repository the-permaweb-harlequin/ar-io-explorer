import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useDuckDB } from '@/lib/duckdb'
import { cn } from '@/lib/utils'

// Convert hex string to base64url (Arweave format)
const hexToBase64Url = (hex: string): string => {
  if (!hex) return ''
  try {
    // Remove any whitespace and convert to lowercase
    const cleanHex = hex.replace(/\s/g, '').toLowerCase()
    // Convert hex to bytes
    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    )
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...bytes))
    // Convert to base64url (replace + with -, / with _, remove padding =)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  } catch (error) {
    console.error('Error converting hex to base64url:', error)
    return hex // Return original if conversion fails
  }
}

interface QueryResult {
  id: string
  query: string
  result?: any[]
  error?: string
  timestamp: Date
  isLoading?: boolean
}

interface ARFSParquetNotebookProps {
  className?: string
}

export function ARFSParquetNotebook({ className }: ARFSParquetNotebookProps) {
  const [isReady, setIsReady] = useState(false)
  const [query, setQuery] = useState('')
  const [queryHistory, setQueryHistory] = useState<QueryResult[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  // Use the same ARFS explorer DuckDB instance
  const { db, loading, error } = useDuckDB({
    id: 'arfs-explorer',
    name: 'ARFS Explorer Database',
    debug: true,
  })

  useEffect(() => {
    if (db && !loading && !isReady) {
      setIsReady(true)
      // Add welcome message
      const welcomeResult: QueryResult = {
        id: 'welcome',
        query: '-- Welcome to ARFS Parquet Notebook',
        result: [
          { message: 'ARFS Parquet Notebook - Connected to arfs-explorer DuckDB instance' },
          { message: 'Available datasets:' },
          { message: "• Tags: 'http://localhost:4000/local/datasets/tags/data/height%3D911404-1094394/tags.parquet'" },
          { message: "• Transactions: 'http://localhost:4000/local/datasets/transactions/data/height%3D911404-1094394/transactions.parquet'" },
          { message: "• Blocks: 'http://localhost:4000/local/datasets/blocks/data/height%3D911404-1094394/blocks.parquet'" },
          { message: '' },
          { message: 'Try these queries to explore the data structure:' },
          { message: "DESCRIBE 'http://localhost:4000/local/datasets/tags/data/height%3D911404-1094394/tags.parquet'" },
          { message: "SELECT * FROM 'http://localhost:4000/local/datasets/tags/data/height%3D911404-1094394/tags.parquet' LIMIT 5" },
          { message: '' },
          { message: 'Press Ctrl+Enter to execute queries.' },
        ],
        timestamp: new Date(),
      }
      setQueryHistory([welcomeResult])
    }
  }, [db, loading, isReady])

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
    setQueryHistory([])
    setQuery('')
    setHistoryIndex(-1)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Initializing ARFS DuckDB instance...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to initialize DuckDB instance</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">ARFS Parquet Notebook</h1>
        <p className="text-muted-foreground">
          Explore the ARFS data using SQL queries on the parquet files. This terminal is connected to the same DuckDB instance as the ARFS Explorer.
        </p>
        
        {/* Quick reference */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 font-semibold">Quick Reference</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Tags:</strong> <code>'http://localhost:4000/local/datasets/tags/data/height%3D911404-1094394/tags.parquet'</code></p>
            <p><strong>Transactions:</strong> <code>'http://localhost:4000/local/datasets/transactions/data/height%3D911404-1094394/transactions.parquet'</code></p>
            <p><strong>Blocks:</strong> <code>'http://localhost:4000/local/datasets/blocks/data/height%3D911404-1094394/blocks.parquet'</code></p>
          </div>
          
          <h4 className="mb-1 mt-3 font-medium">Useful Queries:</h4>
          <div className="space-y-1 text-sm font-mono">
            <p>• <code>DESCRIBE 'http://localhost:4000/local/datasets/tags/data/height%3D911404-1094394/tags.parquet'</code></p>
            <p>• <code>DESCRIBE 'http://localhost:4000/local/datasets/transactions/data/height%3D911404-1094394/transactions.parquet'</code></p>
            <p>• <code>SELECT * FROM 'http://localhost:4000/local/datasets/tags/data/height%3D911404-1094394/tags.parquet' LIMIT 5</code></p>
            <p>• <code>SELECT DISTINCT CAST(tag_name AS VARCHAR) FROM 'http://localhost:4000/local/datasets/tags/data/height%3D911404-1094394/tags.parquet' LIMIT 20</code></p>
          </div>
        </div>
      </div>

      {/* Terminal */}
      {isReady && (
        <div className="rounded-lg border bg-background">
          {/* Terminal Header */}
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-2 text-sm font-medium">ARFS Parquet Notebook</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearHistory}>
              Clear
            </Button>
          </div>

          {/* Terminal Content */}
          <div className="h-96 overflow-y-auto p-4">
            <div ref={terminalRef} className="space-y-2 font-mono text-sm">
              {queryHistory.map((result) => (
                <div key={result.id} className="space-y-1">
                  <div className="text-muted-foreground">
                    <span className="text-green-400">$</span> {result.query}
                  </div>
                  {result.isLoading && (
                    <div className="text-blue-400">Executing query...</div>
                  )}
                  {result.error && (
                    <div className="text-red-400">Error: {result.error}</div>
                  )}
                  {result.result && (
                    <div className="pl-2">
                      {result.result.map((row, i) => (
                        <div key={i} className="text-foreground">
                          {typeof row === 'object' && row.message
                            ? row.message
                            : JSON.stringify(row, (key, value) => {
                                if (typeof value === 'bigint') {
                                  return value.toString()
                                }
                                // Handle byte arrays (objects with numeric keys)
                                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                  const keys = Object.keys(value)
                                  if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
                                    const bytes = keys.map(k => value[k]).filter(b => typeof b === 'number')
                                    
                                    // For Arweave ID fields, convert to base64url format
                                    if (key === 'id' || key === 'owner' || key === 'target' || key === 'anchor' || 
                                        key === 'data_root' || key === 'parent' || key === 'root_transaction_id' ||
                                        bytes.length === 32 || bytes.length === 64) {
                                      const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('')
                                      return hexToBase64Url(hex)
                                    }
                                    
                                    // For text fields like tag_name, tag_value, try to convert to string
                                    if (key === 'tag_name' || key === 'tag_value' || key === 'content_type') {
                                      try {
                                        return String.fromCharCode(...bytes)
                                      } catch {
                                        return `[${bytes.length} bytes]`
                                      }
                                    }
                                    
                                    // Default: show as hex for other binary data
                                    return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
                                  }
                                }
                                return value
                              }, 2)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex items-start space-x-2">
              <span className="mt-2 font-mono text-sm text-green-400">$</span>
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter SQL query... (Ctrl+Enter to execute)"
                className="flex-1 resize-none rounded border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <Button onClick={executeQuery} disabled={!query.trim()}>
                Execute
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Press Ctrl+Enter to execute • Use ↑/↓ arrows for history
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
