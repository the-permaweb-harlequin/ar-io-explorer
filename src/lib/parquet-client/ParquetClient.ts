import type { AsyncDuckDB } from '@duckdb/duckdb-wasm'

import { type Logger, createLogger } from '@/lib/logger'

import type {
  ArweaveTag,
  ArweaveTransaction,
  QueryOptions,
  TagFilter,
  TransactionWithTags,
} from './types'
import { base64UrlToHex, buildTagFilters, hexToBase64Url } from './utils'

export class ParquetClient {
  private db: AsyncDuckDB
  private baseUrl: string
  private logger: Logger

  constructor(
    db: AsyncDuckDB,
    baseUrl = 'http://localhost:4000/local/datasets',
  ) {
    this.db = db
    this.baseUrl = baseUrl
    this.logger = createLogger('ParquetClient')
  }

  private get tagsPath(): string {
    return `'${this.baseUrl}/tags/data/height%3D911404-1094394/tags.parquet'`
  }

  private get transactionsPath(): string {
    return `'${this.baseUrl}/transactions/data/height%3D911404-1094394/transactions.parquet'`
  }

  /**
   * Get transactions by their IDs
   */
  async getTransactionsById(
    ids: string | string[],
    options: QueryOptions = {},
  ): Promise<ArweaveTransaction[]> {
    const transactionIds = Array.isArray(ids) ? ids : [ids]

    if (transactionIds.length === 0) {
      this.logger.debug('No transaction IDs provided, returning empty array')
      return []
    }

    this.logger.info(`Fetching ${transactionIds.length} transactions by ID`)

    // Convert base64url IDs to hex for querying
    const hexIds = transactionIds.map((id) => base64UrlToHex(id))
    const hexIdsList = hexIds.map((hex) => `'${hex}'`).join(', ')

    const {
      limit = 100,
      offset = 0,
      orderBy = 'height',
      orderDirection = 'DESC',
    } = options

    const sql = `
      SELECT 
        hex(t.id) as id,
        t.indexed_at,
        t.block_transaction_index,
        t.is_data_item,
        hex(t.target) as target,
        t.quantity,
        t.reward,
        hex(t.anchor) as anchor,
        t.data_size,
        t.content_type,
        t.format,
        t.height,
        hex(t.owner_address) as owner_address,
        hex(t.data_root) as data_root,
        hex(t.parent) as parent,
        t.offset,
        t.size,
        t.data_offset,
        t.owner_offset,
        t.owner_size,
        hex(t.owner) as owner,
        t.signature_offset,
        t.signature_size,
        t.signature_type,
        hex(t.root_transaction_id) as root_transaction_id,
        t.root_parent_offset
      FROM ${this.transactionsPath} as t
      WHERE hex(t.id) IN (${hexIdsList})
      ORDER BY t.${orderBy} ${orderDirection}
      LIMIT ${limit} OFFSET ${offset}
    `

    this.logger.time('getTransactionsById')
    this.logger.query(sql, undefined, { transactionIds, options })

    const connection = await this.db.connect()
    try {
      const result = await connection.query(sql)
      const rows = result.toArray().map((row) => row.toJSON())

      this.logger.info(`Found ${rows.length} transactions`)

      // Convert hex fields back to base64url
      return rows.map((row) => ({
        ...row,
        id: hexToBase64Url(row.id),
        target: row.target ? hexToBase64Url(row.target) : undefined,
        anchor: row.anchor ? hexToBase64Url(row.anchor) : undefined,
        owner_address: row.owner_address
          ? hexToBase64Url(row.owner_address)
          : undefined,
        data_root: row.data_root ? hexToBase64Url(row.data_root) : undefined,
        parent: row.parent ? hexToBase64Url(row.parent) : undefined,
        owner: hexToBase64Url(row.owner),
        root_transaction_id: row.root_transaction_id
          ? hexToBase64Url(row.root_transaction_id)
          : undefined,
      })) as ArweaveTransaction[]
    } catch (error) {
      this.logger.error('Failed to fetch transactions by ID', error)
      throw error
    } finally {
      this.logger.timeEnd('getTransactionsById')
      await connection.close()
    }
  }

  /**
   * Get transactions by tag filters
   */
  async getTransactionsByTags(
    tagFilters: TagFilter[],
    options: QueryOptions & { owner?: string } = {},
  ): Promise<TransactionWithTags[]> {
    if (tagFilters.length === 0) {
      this.logger.error('No tag filters provided')
      throw new Error('At least one tag filter is required')
    }

    this.logger.info(`Fetching transactions by tags`, { tagFilters, options })

    const {
      limit = 100,
      offset = 0,
      orderBy = 'height',
      orderDirection = 'DESC',
      owner,
    } = options

    const whereClause = buildTagFilters(tagFilters)

    // Add owner filter if provided
    const ownerFilter = owner
      ? `AND hex(t.owner) = '${base64UrlToHex(owner)}'`
      : ''

    // First, find transaction IDs that match our tag criteria
    const matchingTxSql = `
      SELECT DISTINCT hex(t.id) as id
      FROM ${this.transactionsPath} as t
      JOIN ${this.tagsPath} as tags ON tags.id = t.id
      WHERE ${whereClause} ${ownerFilter}
      ORDER BY t.${orderBy} ${orderDirection}
      LIMIT ${limit} OFFSET ${offset}
    `

    // Then get all transaction data and ALL tags for those transactions
    const sql = `
      WITH matching_transactions AS (
        ${matchingTxSql}
      )
      SELECT 
        hex(t.id) as id,
        t.indexed_at,
        t.block_transaction_index,
        t.is_data_item,
        hex(t.target) as target,
        t.quantity,
        t.reward,
        hex(t.anchor) as anchor,
        t.data_size,
        t.content_type,
        t.format,
        t.height,
        hex(t.owner_address) as owner_address,
        hex(t.data_root) as data_root,
        hex(t.parent) as parent,
        t.offset,
        t.size,
        t.data_offset,
        t.owner_offset,
        t.owner_size,
        hex(t.owner) as owner,
        t.signature_offset,
        t.signature_size,
        t.signature_type,
        hex(t.root_transaction_id) as root_transaction_id,
        t.root_parent_offset,
        -- Include ALL tag information for matching transactions
        all_tags.tag_index,
        CAST(all_tags.tag_name AS VARCHAR) as tag_name,
        CAST(all_tags.tag_value AS VARCHAR) as tag_value
      FROM matching_transactions mt
      JOIN ${this.transactionsPath} as t ON hex(t.id) = mt.id
      JOIN ${this.tagsPath} as all_tags ON all_tags.id = t.id
      ORDER BY t.${orderBy} ${orderDirection}, all_tags.tag_index
    `

    this.logger.time('getTransactionsByTags')
    this.logger.query(sql, undefined, { tagFilters, options })

    const connection = await this.db.connect()
    try {
      const result = await connection.query(sql)
      const rows = result.toArray().map((row) => row.toJSON())

      this.logger.info(`Found ${rows.length} transaction-tag rows`)

      // Group rows by transaction ID since we now get multiple rows per transaction
      const transactionMap = new Map<string, any>()
      const tagsByTxId = new Map<string, ArweaveTag[]>()

      rows.forEach((row) => {
        const txId = hexToBase64Url(row.id)
        // Store transaction data (only once per transaction)
        if (!transactionMap.has(txId)) {
          transactionMap.set(txId, {
            id: txId,
            indexed_at: row.indexed_at,
            block_transaction_index: row.block_transaction_index,
            is_data_item: row.is_data_item,
            target: row.target ? hexToBase64Url(row.target) : undefined,
            quantity: row.quantity,
            reward: row.reward,
            anchor: row.anchor ? hexToBase64Url(row.anchor) : undefined,
            data_size: row.data_size,
            content_type: row.content_type,
            format: row.format,
            height: row.height,
            owner_address: row.owner_address
              ? hexToBase64Url(row.owner_address)
              : undefined,
            data_root: row.data_root
              ? hexToBase64Url(row.data_root)
              : undefined,
            parent: row.parent ? hexToBase64Url(row.parent) : undefined,
            offset: row.offset,
            size: row.size,
            data_offset: row.data_offset,
            owner_offset: row.owner_offset,
            owner_size: row.owner_size,
            owner: hexToBase64Url(row.owner),
            signature_offset: row.signature_offset,
            signature_size: row.signature_size,
            signature_type: row.signature_type,
            root_transaction_id: row.root_transaction_id
              ? hexToBase64Url(row.root_transaction_id)
              : undefined,
            root_parent_offset: row.root_parent_offset,
          })
        }

        // Store tag data
        if (!tagsByTxId.has(txId)) {
          tagsByTxId.set(txId, [])
        }
        tagsByTxId.get(txId)!.push({
          id: txId,
          tag_index: row.tag_index,
          tag_name: row.tag_name,
          tag_value: row.tag_value,
          indexed_at: row.indexed_at,
          is_data_item: row.is_data_item,
          height: row.height,
        })
      })

      // Combine transactions with their tags
      const enrichedTransactions = Array.from(transactionMap.values()).map(
        (transaction) => ({
          ...transaction,
          tags: tagsByTxId.get(transaction.id) || [],
        }),
      ) as TransactionWithTags[]

      this.logger.info(
        `Processed ${enrichedTransactions.length} unique transactions with tags`,
      )

      // Log sample transaction with tags for debugging
      if (enrichedTransactions.length > 0) {
        const sample = enrichedTransactions[0]
        this.logger.debug('Sample transaction with tags:', {
          id: sample.id,
          tagCount: sample.tags.length,
          sampleTags: sample.tags
            .slice(0, 3)
            .map((t) => ({ name: t.tag_name, value: t.tag_value })),
        })
      }

      return enrichedTransactions
    } catch (error) {
      this.logger.error('Failed to fetch transactions by tags', error)
      throw error
    } finally {
      this.logger.timeEnd('getTransactionsByTags')
      await connection.close()
    }
  }

  /**
   * Get tags for specific transaction IDs
   */
  async getTagsByTransactionIds(
    transactionIds: string[],
  ): Promise<ArweaveTag[]> {
    if (transactionIds.length === 0) {
      this.logger.debug('No transaction IDs provided for tag lookup')
      return []
    }

    this.logger.debug(
      `Looking up tags for ${transactionIds.length} transactions`,
    )

    const hexIds = transactionIds.map((id) => base64UrlToHex(id))
    const hexIdsList = hexIds.map((hex) => `'${hex}'`).join(', ')

    const sql = `
      SELECT 
        tags.height,
        hex(tags.id) as id,
        tags.tag_index,
        tags.indexed_at,
        CAST(tags.tag_name AS VARCHAR) as tag_name,
        CAST(tags.tag_value AS VARCHAR) as tag_value,
        tags.is_data_item
      FROM ${this.tagsPath} as tags
      WHERE hex(tags.id) IN (${hexIdsList})
      ORDER BY tags.id, tags.tag_index
    `

    this.logger.time('getTagsByTransactionIds')
    this.logger.query(sql, undefined, { transactionIds, hexIds })

    const connection = await this.db.connect()
    try {
      const result = await connection.query(sql)
      const rows = result.toArray().map((row) => row.toJSON())

      this.logger.info(
        `Found ${rows.length} tag records for ${transactionIds.length} transactions`,
      )

      const tags = rows.map((row) => ({
        ...row,
        id: hexToBase64Url(row.id),
      })) as ArweaveTag[]

      // Log sample of tags for debugging
      if (tags.length > 0) {
        this.logger.debug('Sample tags found:', tags.slice(0, 3))
      } else {
        this.logger.warn(
          'No tags found for any of the provided transaction IDs',
        )
      }

      return tags
    } catch (error) {
      this.logger.error('Failed to fetch tags by transaction IDs', error)
      throw error
    } finally {
      this.logger.timeEnd('getTagsByTransactionIds')
      await connection.close()
    }
  }

  /**
   * Get all unique tag names
   */
  async getTagNames(limit = 100): Promise<string[]> {
    const sql = `
      SELECT DISTINCT CAST(tag_name AS VARCHAR) as tag_name
      FROM ${this.tagsPath}
      ORDER BY tag_name
      LIMIT ${limit}
    `

    const connection = await this.db.connect()
    try {
      const result = await connection.query(sql)
      const rows = result.toArray().map((row) => row.toJSON())
      return rows.map((row) => row.tag_name)
    } finally {
      await connection.close()
    }
  }

  /**
   * Get tag values for a specific tag name
   */
  async getTagValues(tagName: string, limit = 100): Promise<string[]> {
    const sql = `
      SELECT DISTINCT CAST(tag_value AS VARCHAR) as tag_value
      FROM ${this.tagsPath}
      WHERE CAST(tag_name AS VARCHAR) = '${tagName}'
      ORDER BY tag_value
      LIMIT ${limit}
    `

    const connection = await this.db.connect()
    try {
      const result = await connection.query(sql)
      const rows = result.toArray().map((row) => row.toJSON())
      return rows.map((row) => row.tag_value)
    } finally {
      await connection.close()
    }
  }
}
