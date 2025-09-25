# Multi-Instance DuckDB Library

A refactored version of [duckdb-wasm-kit](https://github.com/holdenmatt/duckdb-wasm-kit) that supports multiple database instances while keeping WASM bundles as singletons.

## Key Features

- **Multiple Database Instances**: Run multiple independent DuckDB instances simultaneously
- **Singleton Bundle Management**: WASM bundles are loaded once and shared across instances
- **React Query Integration**: Leverages React Query for caching and deduplication
- **TypeScript Support**: Full TypeScript support with comprehensive types
- **File Operations**: Import/export CSV, Arrow, and Parquet files
- **Error Handling**: Comprehensive error types for better debugging

## Basic Usage

### Creating Database Instances

```typescript
import { useDuckDB, DuckDBInstanceConfig } from '@/lib/duckdb'

// Use the default instance
const MyComponent = () => {
  const { db, loading, error } = useDefaultDuckDB({
    debug: true
  })

  if (loading) return <div>Loading DuckDB...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!db) return null

  // Use db here...
}

// Create a named instance
const AnotherComponent = () => {
  const config: DuckDBInstanceConfig = {
    id: 'analytics-db',
    name: 'Analytics Database',
    debug: true,
    config: {
      query: {
        castBigIntToDouble: true,
      }
    }
  }

  const { db, loading, error } = useDuckDB(config)
  // ...
}
```

### Running Queries

```typescript
import { useDuckDBQuery, useDefaultDuckDBQuery } from '@/lib/duckdb'

// Query the default instance
const MyComponent = () => {
  const { arrow, loading, error, refetch } = useDefaultDuckDBQuery(`
    SELECT * FROM my_table
    WHERE created_at > '2024-01-01'
  `)

  if (loading) return <div>Running query...</div>
  if (error) return <div>Query failed: {error.message}</div>

  return (
    <div>
      <p>Found {arrow?.numRows} rows</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}

// Query a specific instance
const AnalyticsComponent = () => {
  const { arrow, loading, error } = useDuckDBQuery(
    'SELECT COUNT(*) as total FROM events',
    { instanceId: 'analytics-db', debug: true }
  )
  // ...
}
```

### File Operations

```typescript
import { exportCsv, exportParquet, insertFile } from '@/lib/duckdb'

// Import a file to the default instance
const handleFileUpload = async (file: File) => {
  try {
    await insertFile(file, {
      instanceId: 'default', // optional, defaults to 'default'
      tableName: 'uploaded_data', // optional, defaults to filename
      debug: true,
    })
    console.log('File imported successfully!')
  } catch (error) {
    console.error('Import failed:', error)
  }
}

// Export data
const handleExport = async () => {
  try {
    // Export as CSV
    const csvFile = await exportCsv('my_table', {
      instanceId: 'analytics-db',
      filename: 'export.csv',
      delimiter: ',',
    })

    // Export as Parquet (compressed)
    const parquetFile = await exportParquet('my_table', {
      instanceId: 'analytics-db',
      compression: 'zstd',
    })

    // Trigger downloads
    const url1 = URL.createObjectURL(csvFile)
    const url2 = URL.createObjectURL(parquetFile)
    // ... create download links
  } catch (error) {
    console.error('Export failed:', error)
  }
}
```

### Direct Database Access

```typescript
import { getDuckDBInstance, runQuery } from '@/lib/duckdb'

// Get an instance directly (outside React)
const processData = async () => {
  const instance = await getDuckDBInstance({
    id: 'batch-processor',
    name: 'Batch Processing DB',
  })

  // Run queries directly
  const result = await runQuery(
    instance.db,
    "CREATE TABLE test AS SELECT 1 as id, 'hello' as message",
    true, // debug
  )

  console.log('Query completed:', result.numRows)
}
```

### Bundle Preloading

```typescript
import { usePreloadDuckDBBundle } from '@/lib/duckdb'

// Preload the WASM bundle for better UX
const App = () => {
  const { isPreloaded, isLoading, error } = usePreloadDuckDBBundle()

  if (isLoading) {
    return <div>Loading DuckDB WASM bundle...</div>
  }

  if (error) {
    return <div>Failed to load DuckDB: {error.message}</div>
  }

  return (
    <div>
      {isPreloaded && <p>✅ DuckDB ready!</p>}
      {/* Your app components */}
    </div>
  )
}
```

## Instance Management

### Multiple Instances

```typescript
// Create different instances for different purposes
const configs = [
  { id: 'user-data', name: 'User Analytics' },
  { id: 'logs', name: 'Log Processing' },
  { id: 'temp', name: 'Temporary Workspace' },
]

const MultiInstanceComponent = () => {
  const userDb = useDuckDB(configs[0])
  const logsDb = useDuckDB(configs[1])
  const tempDb = useDuckDB(configs[2])

  // Each instance is independent
  // They share the same WASM bundle but have separate data
}
```

### Instance Cleanup

```typescript
import { instanceManager } from '@/lib/duckdb'

// Close a specific instance
await instanceManager.closeInstance('temp-instance')

// Close all instances (useful for cleanup)
await instanceManager.closeAllInstances()

// Clean up old instances (older than 30 minutes)
await instanceManager.cleanupOldInstances(30 * 60 * 1000)

// Get statistics
const stats = instanceManager.getStats()
console.log('Active instances:', stats.totalInstances)
```

## Error Handling

The library provides specific error types for better error handling:

```typescript
import {
  DuckDBFileError,
  DuckDBInstanceError,
  DuckDBQueryError,
} from '@/lib/duckdb'

try {
  await insertFile(file, { instanceId: 'nonexistent' })
} catch (error) {
  if (error instanceof DuckDBInstanceError) {
    console.error('Instance error:', error.instanceId, error.title)
  } else if (error instanceof DuckDBFileError) {
    console.error('File error:', error.filename, error.title)
  } else if (error instanceof DuckDBQueryError) {
    console.error('Query error:', error.sql, error.title)
  }
}
```

## Performance Tips

1. **Preload the bundle** early in your app lifecycle
2. **Reuse instances** instead of creating new ones frequently
3. **Use React Query** for caching query results
4. **Clean up old instances** periodically to free memory
5. **Use Parquet** for large datasets (90%+ compression vs CSV)

## Differences from duckdb-wasm-kit

- ✅ **Multiple instances** instead of singleton database
- ✅ **React Query integration** for better caching
- ✅ **Comprehensive TypeScript** types and error handling
- ✅ **Instance management** with cleanup utilities
- ✅ **Shared WASM bundles** for memory efficiency
- ✅ **Modern React patterns** with hooks
