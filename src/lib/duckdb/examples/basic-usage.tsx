/**
 * Example component demonstrating basic DuckDB multi-instance usage
 */
import React, { useState } from 'react'

import {
  DuckDBInstanceConfig,
  exportCsv,
  insertFile,
  useDefaultDuckDB,
  useDefaultDuckDBQuery,
  useDuckDB,
  useDuckDBQuery,
} from '../index'

export const BasicDuckDBExample: React.FC = () => {
  const [, setFile] = useState<File | null>(null)
  const [tableName, setTableName] = useState('my_table')

  // Use the default instance
  const {
    db: defaultDb,
    loading: defaultLoading,
    error: defaultError,
  } = useDefaultDuckDB({
    debug: true,
  })

  // Create a second instance for analytics
  const analyticsConfig: DuckDBInstanceConfig = {
    id: 'analytics',
    name: 'Analytics Database',
    debug: true,
  }
  const { db: analyticsDb, loading: analyticsLoading } =
    useDuckDB(analyticsConfig)

  // Query the default instance
  const { arrow: defaultData, loading: queryLoading } = useDefaultDuckDBQuery(
    defaultDb ? `SELECT name FROM sqlite_master WHERE type='table'` : undefined,
  )

  // Query the analytics instance
  const { arrow: analyticsData } = useDuckDBQuery(
    analyticsDb
      ? `SELECT name FROM sqlite_master WHERE type='table'`
      : undefined,
    { instanceId: 'analytics' },
  )

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      try {
        await insertFile(selectedFile, {
          instanceId: 'default',
          tableName: tableName || selectedFile.name,
          debug: true,
        })
        alert('File uploaded successfully!')
      } catch (error) {
        console.error('Upload failed:', error)
        alert(`Upload failed: ${error}`)
      }
    }
  }

  const handleExport = async () => {
    if (!tableName) return

    try {
      const csvFile = await exportCsv(tableName, {
        instanceId: 'default',
        filename: `${tableName}.csv`,
      })

      // Create download link
      const url = URL.createObjectURL(csvFile)
      const a = document.createElement('a')
      a.href = url
      a.download = csvFile.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error}`)
    }
  }

  if (defaultLoading || analyticsLoading) {
    return <div className="p-4">Loading DuckDB instances...</div>
  }

  if (defaultError) {
    return <div className="p-4 text-red-600">Error: {defaultError.message}</div>
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">DuckDB Multi-Instance Example</h1>

      {/* Instance Status */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded border p-4">
          <h3 className="font-semibold">Default Instance</h3>
          <p className="text-sm text-gray-600">
            Status: {defaultDb ? '✅ Ready' : '❌ Not Ready'}
          </p>
          {defaultData && (
            <p className="text-sm">Tables: {defaultData.numRows}</p>
          )}
        </div>

        <div className="rounded border p-4">
          <h3 className="font-semibold">Analytics Instance</h3>
          <p className="text-sm text-gray-600">
            Status: {analyticsDb ? '✅ Ready' : '❌ Not Ready'}
          </p>
          {analyticsData && (
            <p className="text-sm">Tables: {analyticsData.numRows}</p>
          )}
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-4 rounded border p-4">
        <h3 className="mb-2 font-semibold">Upload File</h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Table name (optional)"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="w-full rounded border p-2"
          />
          <input
            type="file"
            accept=".csv,.parquet,.arrow"
            onChange={handleFileUpload}
            className="w-full rounded border p-2"
          />
          <p className="text-sm text-gray-600">
            Supports CSV, Parquet, and Arrow files
          </p>
        </div>
      </div>

      {/* Export */}
      <div className="mb-4 rounded border p-4">
        <h3 className="mb-2 font-semibold">Export Data</h3>
        <button
          onClick={handleExport}
          disabled={!tableName || !defaultDb}
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-300"
        >
          Export as CSV
        </button>
      </div>

      {/* Query Results */}
      {queryLoading && <div>Loading query results...</div>}

      {defaultData && (
        <div className="rounded border p-4">
          <h3 className="mb-2 font-semibold">Default Instance Tables</h3>
          <div className="space-y-1">
            {Array.from({ length: defaultData.numRows }, (_, i) => {
              const row = defaultData.get(i)
              return (
                <div key={i} className="font-mono text-sm">
                  {row?.toArray()[0]}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
