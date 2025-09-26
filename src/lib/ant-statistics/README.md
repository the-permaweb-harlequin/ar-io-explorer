# ANT Statistics Persistence

This module provides persistent storage for ANT (Arweave Name Token) statistics using DuckDB and IndexedDB.

## Features

- **Persistent Storage**: Statistics are stored in a DuckDB database that persists in IndexedDB
- **Parquet Backup**: Data is automatically exported to parquet files for backup and offline access
- **Smart Caching**: Fresh statistics (< 1 hour old) are served from cache, reducing API calls
- **History Tracking**: All statistics changes are tracked in a history table
- **Offline Support**: Can load from cached parquet files when offline

## Architecture

```
useANTStatistics Hook
       ↓
ANTStatisticsPersistence
       ↓
PersistentDataManager
       ↓
DuckDB Instance (ar-io-explorer-db)
       ↓
IndexedDB (Browser Storage)
```

## Database Schema

### `ant_statistics` Table
- `id`: Primary key
- `timestamp`: When the statistics were recorded
- `latest_version`: Latest ANT module ID
- `total_ants`: Total number of ANTs
- `version_counts`: JSON object with version distribution
- `created_at`: Record creation time
- `updated_at`: Record update time

### `ant_statistics_history` Table
- Same schema as `ant_statistics` but keeps all historical records

## Usage

### Basic Usage (Automatic)

The `useANTStatistics()` hook automatically handles persistence:

```tsx
import { useANTStatistics } from '@/hooks/useANTVersions'

function MyComponent() {
  const stats = useANTStatistics() // Automatically cached and persisted
  
  return (
    <div>
      <p>Total ANTs: {stats.totalAnts}</p>
      <p>Latest Version: {stats.latestVersion}</p>
    </div>
  )
}
```

### Manual Management

```tsx
import { antStatisticsPersistence, ANTStatisticsUtils } from '@/lib/ant-statistics'

// Get latest cached statistics
const stats = await antStatisticsPersistence.getLatestStatistics()

// Force refresh (clear cache)
await ANTStatisticsUtils.forceRefresh()

// Get debug information
const debugInfo = await ANTStatisticsUtils.getDebugInfo()

// Export debug info to console
await ANTStatisticsUtils.exportToConsole()
```

### Named Persistent Instances

You can create multiple named persistent database instances:

```tsx
import { getPersistentDataManager } from '@/lib/duckdb'

// Create different instances for different purposes
const antStatsDB = getPersistentDataManager('ar-io-explorer-db') // Default
const arfsDB = getPersistentDataManager('arfs-data', {
  name: 'ArFS Data Storage',
  config: { memory_limit: '256MB' }
})
const analyticsDB = getPersistentDataManager('analytics-db', {
  name: 'Analytics Database', 
  config: { memory_limit: '1GB', threads: 2 }
})

// Each instance has its own database file and parquet backups
await antStatsDB.initialize()
await arfsDB.initialize()
await analyticsDB.initialize()
```

### Browser Console Debugging

The utilities are available globally in the browser console:

```javascript
// Clear all cached data
await ANTStatisticsUtils.clearCache()

// Get debug information
await ANTStatisticsUtils.exportToConsole()

// Get statistics history
const history = await ANTStatisticsUtils.getHistory(7) // Last 7 days
```

## Performance Benefits

1. **Reduced API Calls**: Fresh statistics (< 1 hour) are served from cache
2. **Faster Loading**: Cached data loads instantly while fresh data loads in background
3. **Offline Support**: Can display last known statistics when offline
4. **Persistent Across Sessions**: Data survives browser restarts

## Storage Details

- **DuckDB Database**: `ar-io-explorer.db` in IndexedDB
- **Parquet Files**: Stored in `ar-io-explorer-parquet` IndexedDB store
- **Memory Usage**: ~10-50MB for statistics data
- **Disk Usage**: ~1-5MB in IndexedDB

## Configuration

The persistent database is configured in `persistent-config.ts`:

```typescript
export const PERSISTENT_DB_CONFIG = {
  id: 'ar-io-explorer-db',
  config: {
    path: 'ar-io-explorer.db',
    memory_limit: '1GB',
    // ... other DuckDB settings
  }
}
```

## Error Handling

The system gracefully handles errors:
- Database initialization failures fall back to in-memory calculation
- Parquet export failures don't affect normal operation
- Cache loading failures fall back to fresh data

## Monitoring

Check the browser console for persistence status messages:
- `🗄️ Initializing persistent database...`
- `📊 Using cached ANT statistics`
- `💾 Saved fresh ANT statistics to persistent storage`
- `📦 Exported ant_statistics to parquet and stored in IndexedDB`
