# @the-permaweb-harlequin/shared-types

Shared TypeScript types for the Harlequin AR.IO Explorer ecosystem.

## Overview

This package contains all the shared type definitions used across the Harlequin AR.IO Explorer project, including:

- **Frontend App**: React-based explorer interface
- **Sidecar Server**: Koa-based webhook processor and parquet manager
- **Future packages**: Any additional services or tools

## Installation

```bash
# In workspace packages
npm install @the-permaweb-harlequin/shared-types

# Or with pnpm workspace
pnpm add @the-permaweb-harlequin/shared-types
```

## Usage

### Import All Types

```typescript
import type {
  ApiResponse,
  ArNSName,
  Transaction,
} from '@the-permaweb-harlequin/shared-types'
```

### Import Specific Modules

```typescript
// Arweave-specific types
// AO-specific types
import type {
  AOMessage,
  AOProcess,
} from '@the-permaweb-harlequin/shared-types/ao'
// API response types
import type {
  ApiResponse,
  PaginatedResponse,
} from '@the-permaweb-harlequin/shared-types/api'
// ArNS-specific types
import type {
  ArNSName,
  ArNSRecord,
} from '@the-permaweb-harlequin/shared-types/arns'
import type {
  Block,
  Tag,
  Transaction,
} from '@the-permaweb-harlequin/shared-types/arweave'
// Parquet and data management types
import type {
  DataCatalog,
  TableStats,
} from '@the-permaweb-harlequin/shared-types/parquet'
```

## Type Categories

### Core Arweave Types (`/arweave`)

- `Transaction` - Arweave transaction structure
- `Tag` - Transaction tag key-value pairs
- `Block` - Block information with transactions
- `WalletBalance` - Wallet balance information
- `TransactionClassification` - Transaction type classification

### ArNS Types (`/arns`)

- `ArNSName` - ArNS name registration data
- `ArNSRecord` - DNS record information
- `ANTRegistry` - ANT registry entries
- `ArNSNameFilters` - Search and filter parameters
- `ArNSSearchResult` - Paginated search results

### AO Types (`/ao`)

- `AOProcess` - AO process information
- `AOMessage` - AO message data
- `AOModule` - AO module definitions
- `AOResult` - AO execution results
- `AOProcessFilters` - Process search filters
- `AOMessageFilters` - Message search filters

### API Types (`/api`)

- `ApiResponse<T>` - Standard API response wrapper
- `PaginatedResponse<T>` - Paginated data responses
- `HealthResponse` - Health check response
- `ValidationResult` - Configuration validation
- `SearchParams` - Search parameters
- `ApiError` - Error response structure

### Parquet & Data Types (`/parquet`)

- `TableStats` - Parquet table statistics
- `DataCatalog` - Data catalog structure
- `TableInfo` - Individual table metadata
- `PartitionInfo` - Partition information
- `CatalogInfo` - Catalog configuration
- `GeneralTransaction` - Flattened transaction for storage

## Common Enums

```typescript
import {
  RecordType,
  TableName,
  TransactionType,
} from '@the-permaweb-harlequin/shared-types'

// Transaction classification
TransactionType.ARNS_NAME
TransactionType.AO_PROCESS
TransactionType.GENERAL

// DNS record types
RecordType.A
RecordType.CNAME
RecordType.TXT

// Parquet table names
TableName.ARNS_NAMES
TableName.AO_PROCESSES
TableName.TRANSACTIONS
```

## Utility Types

```typescript
import type {
  Address,
  ID,
  Nullable,
  Optional,
} from '@the-permaweb-harlequin/shared-types'

// Common utility types
type MaybeUser = Nullable<User> // User | null
type OptionalId = Optional<string> // string | undefined
type UserId = ID // string
type WalletAddress = Address // string
```

## Development

### Building

```bash
pnpm build
```

### Watching for Changes

```bash
pnpm dev
```

### Type Checking

```bash
pnpm typecheck
```

## Versioning

This package follows semantic versioning. Breaking changes to types will result in a major version bump.

## Contributing

When adding new types:

1. **Organize by domain**: Place types in the appropriate module (`arweave`, `arns`, `ao`, etc.)
2. **Export from index**: Add exports to `src/index.ts`
3. **Document usage**: Update this README with examples
4. **Consider backwards compatibility**: Avoid breaking changes when possible

### Adding New Types

```typescript
// src/new-module.ts
export interface NewType {
  id: string
  name: string
  // ... other properties
}

// src/index.ts
export * from './new-module.js'
```

## License

MIT License - see LICENSE file for details.
