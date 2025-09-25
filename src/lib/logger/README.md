# Browser-Friendly Logger

A lightweight, browser-optimized logging utility with proper formatting, colors, and log levels.

## Features

- 🎨 **Browser-friendly colors** - Beautiful console output with proper styling
- 📊 **Multiple log levels** - DEBUG, INFO, WARN, ERROR with filtering
- ⏱️ **Performance timing** - Built-in timing utilities
- 🔍 **SQL query formatting** - Special formatting for database queries
- 🏗️ **Child loggers** - Create scoped loggers for different components
- 🎛️ **Configurable** - Enable/disable logging, set levels, toggle colors

## Usage

### Basic Logging

```typescript
import { createLogger } from '@/lib/logger'

const logger = createLogger('MyComponent')

logger.debug('Debug information')
logger.info('General information')
logger.warn('Warning message')
logger.error('Error occurred', error)
```

### SQL Query Logging

```typescript
const logger = createLogger('DatabaseClient')

logger.query(
  'SELECT * FROM users WHERE active = true',
  150, // duration in ms (optional)
  { userId: 123 }, // additional parameters
)
```

### Performance Timing

```typescript
logger.time('fetchData')
// ... some operation
logger.timeEnd('fetchData') // Logs: [MyComponent] fetchData: 150ms
```

### Child Loggers

```typescript
const mainLogger = createLogger('ParquetClient')
const queryLogger = mainLogger.child('queries')

queryLogger.info('Executing query') // Logs: [ParquetClient:queries] INFO: Executing query
```

### Configuration

```typescript
import { LogLevel, createLogger } from '@/lib/logger'

const logger = createLogger('MyComponent', {
  level: LogLevel.WARN, // Only show WARN and ERROR
  enabled: false, // Disable all logging
  colors: false, // Disable colors
  timestamp: false, // Hide timestamps
})

// Runtime configuration
logger.setLevel(LogLevel.DEBUG)
logger.setEnabled(true)
```

## Log Levels

- **DEBUG** (0) - Detailed debugging information
- **INFO** (1) - General information messages
- **WARN** (2) - Warning messages
- **ERROR** (3) - Error messages

## Browser Console Output

The logger produces beautiful, colored output in the browser console:

```
2024-01-15T10:30:45.123Z [ParquetClient] INFO: Fetching 5 transactions by ID
  ↳ SQL Query (150ms)
    SELECT hex(t.id) as id, t.owner
    FROM transactions as t
    WHERE hex(t.id) IN ('abc123', 'def456')
  ↳ Parameters: { transactionIds: ['abc123', 'def456'] }
[ParquetClient] INFO: Found 5 transactions
```

## Environment-Based Configuration

The logger automatically adjusts based on environment:

- **Development**: DEBUG level, all features enabled
- **Production**: INFO level, optimized for performance

## Integration with Clients

Both `ParquetClient` and `ArFSClient` use the logger extensively:

```typescript
// ParquetClient logs SQL queries, timing, and results
const parquetClient = new ParquetClient(db)

// ArFSClient logs drive processing and revision handling
const arfsClient = new ArFSClient(parquetClient)
```

This provides comprehensive visibility into data operations and performance characteristics.
