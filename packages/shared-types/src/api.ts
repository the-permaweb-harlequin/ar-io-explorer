// API response types
export interface ApiResponse<T = any> {
  ok: boolean
  response?: T
  error?: string
  message?: string
  details?: any
}

// Health check types
export interface HealthResponse {
  status: string
  timestamp: string
  uptime: number
  memory: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    arrayBuffers: number
  }
  tables: Record<string, import('./parquet.js').TableStats>
}

// Configuration validation
export interface ValidationResult {
  wallet_configured: boolean
  wallet_address: string | null
  arns_name: string
  arweave_connection: boolean
  sufficient_balance: boolean
  ready_for_deployment: boolean
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: Array<T>
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

// Search types
export interface SearchParams {
  query: string
  filters?: Record<string, any>
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

// Error types
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}
