// AO (Arweave Operating System) types
export interface AOProcess {
  process_id: string
  owner: string
  module_id: string
  scheduler: string
  spawned_at: Date
  block_height: number
  transaction_id: string
}

export interface AOMessage {
  message_id: string
  process_id: string
  sender: string
  action?: string
  data_size: number
  created_at: Date
  block_height: number
  transaction_id: string
}

export interface AOModule {
  module_id: string
  owner: string
  name?: string
  version?: string
  created_at: Date
  transaction_id: string
}

export interface AOResult {
  result_id: string
  message_id: string
  process_id: string
  output?: string
  error?: string
  created_at: Date
  transaction_id: string
}

// AO search and filter types
export interface AOProcessFilters {
  owner?: string
  module_id?: string
  limit?: number
  offset?: number
}

export interface AOMessageFilters {
  process_id?: string
  sender?: string
  action?: string
  limit?: number
  offset?: number
}
