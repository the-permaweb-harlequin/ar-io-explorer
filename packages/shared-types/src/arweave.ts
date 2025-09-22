// Core Arweave types
export interface Tag {
  name: string
  value: string
}

export interface Transaction {
  transaction_id: string
  owner: string
  target?: string
  tags: Array<Tag>
  data_size: number
  block_height: number
  block_timestamp: number
  fee?: number
}

export interface Block {
  block_height: number
  block_timestamp: number
  transactions?: Array<Transaction>
}

// Wallet and balance types
export interface WalletBalance {
  address: string
  balance: string
  winston: string
}

// Transaction classification
export interface TransactionClassification {
  type:
    | 'arns_name'
    | 'arns_record'
    | 'ant_registry'
    | 'ao_process'
    | 'ao_message'
    | 'general'
  data: Record<string, any>
}
