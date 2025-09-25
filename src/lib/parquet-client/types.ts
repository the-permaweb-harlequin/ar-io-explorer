// Arweave transaction and tag types for parquet data

export interface ArweaveTransaction {
  id: string
  indexed_at: bigint
  block_transaction_index: number
  is_data_item: boolean
  target?: string
  quantity: bigint
  reward: bigint
  anchor?: string
  data_size: bigint
  content_type?: string
  format: number
  height: bigint
  owner_address?: string
  data_root?: string
  parent?: string
  offset: bigint
  size: bigint
  data_offset: bigint
  owner_offset: bigint
  owner_size: number
  owner: string
  signature_offset: bigint
  signature_size: number
  signature_type: number
  root_transaction_id?: string
  root_parent_offset?: number
}

export interface ArweaveTag {
  height: bigint
  id: string
  tag_index: number
  indexed_at: bigint
  tag_name: string
  tag_value: string
  is_data_item: boolean
}

export interface TagFilter {
  name: string
  value?: string
  operator?: 'eq' | 'like' | 'in'
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
}

export interface TransactionWithTags extends ArweaveTransaction {
  tags: ArweaveTag[]
}
