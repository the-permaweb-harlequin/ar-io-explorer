import type {
  TableStats,
  Tag,
  Transaction,
  TransactionClassification,
  _ANTRegistry,
  _AOMessage,
  _AOProcess,
  _ArNSName,
  _ArNSRecord,
  _GeneralTransaction,
} from '@the-permaweb-harlequin/shared-types'
import { Database } from 'duckdb'
import fs from 'node:fs/promises'
import path from 'node:path'
import { ParquetSchema, ParquetWriter } from 'parquetjs'

export class ParquetManager {
  private db: Database | null = null
  private writers = new Map<string, ParquetWriter>()
  private buffers = new Map<string, Array<any>>()
  private schemas = new Map<string, ParquetSchema>()
  private basePath = './data'
  private batchSize: number

  constructor() {
    this.batchSize = parseInt(process.env.PARQUET_BATCH_SIZE || '1000')
  }

  async init(): Promise<void> {
    // Ensure data directory exists
    await fs.mkdir(this.basePath, { recursive: true })

    // Initialize DuckDB for local queries and parquet operations
    this.db = new Database(':memory:')

    // Setup table schemas
    this.setupSchemas()

    // Initialize buffers for each table
    this.initializeBuffers()

    console.log(
      `📊 ParquetManager initialized with batch size: ${this.batchSize}`,
    )
  }

  setupSchemas(): void {
    // ArNS Names schema
    this.schemas.set(
      'arns_names',
      new ParquetSchema({
        name: { type: 'UTF8' },
        owner: { type: 'UTF8' },
        target: { type: 'UTF8' },
        ttl_seconds: { type: 'INT64' },
        created_at: { type: 'TIMESTAMP_MILLIS' },
        updated_at: { type: 'TIMESTAMP_MILLIS' },
        block_height: { type: 'INT64' },
        transaction_id: { type: 'UTF8' },
      }),
    )

    // Transactions schema
    this.schemas.set(
      'transactions',
      new ParquetSchema({
        id: { type: 'UTF8' },
        owner: { type: 'UTF8' },
        target: { type: 'UTF8', optional: true },
        data_size: { type: 'INT64' },
        block_height: { type: 'INT64' },
        block_timestamp: { type: 'TIMESTAMP_MILLIS' },
        fee: { type: 'INT64' },
        tags: { type: 'UTF8' }, // JSON string
        app_name: { type: 'UTF8', optional: true },
      }),
    )

    // ANT Registry schema
    this.schemas.set(
      'ant_registry',
      new ParquetSchema({
        process_id: { type: 'UTF8' },
        name: { type: 'UTF8' },
        owner: { type: 'UTF8' },
        version: { type: 'UTF8' },
        registered_at: { type: 'TIMESTAMP_MILLIS' },
        transaction_id: { type: 'UTF8' },
      }),
    )

    // ArNS Records schema
    this.schemas.set(
      'arns_records',
      new ParquetSchema({
        name: { type: 'UTF8' },
        record_type: { type: 'UTF8' }, // A, AAAA, CNAME, etc.
        value: { type: 'UTF8' },
        ttl: { type: 'INT64' },
        created_at: { type: 'TIMESTAMP_MILLIS' },
        updated_at: { type: 'TIMESTAMP_MILLIS' },
        transaction_id: { type: 'UTF8' },
      }),
    )

    // AO Processes schema
    this.schemas.set(
      'ao_processes',
      new ParquetSchema({
        process_id: { type: 'UTF8' },
        owner: { type: 'UTF8' },
        module_id: { type: 'UTF8' },
        scheduler: { type: 'UTF8' },
        spawned_at: { type: 'TIMESTAMP_MILLIS' },
        block_height: { type: 'INT64' },
        transaction_id: { type: 'UTF8' },
      }),
    )

    // AO Messages schema
    this.schemas.set(
      'ao_messages',
      new ParquetSchema({
        message_id: { type: 'UTF8' },
        process_id: { type: 'UTF8' },
        sender: { type: 'UTF8' },
        action: { type: 'UTF8', optional: true },
        data_size: { type: 'INT64' },
        created_at: { type: 'TIMESTAMP_MILLIS' },
        block_height: { type: 'INT64' },
        transaction_id: { type: 'UTF8' },
      }),
    )
  }

  initializeBuffers(): void {
    for (const tableName of this.schemas.keys()) {
      this.buffers.set(tableName, [])
    }
  }

  async processTransaction(transaction: Transaction): Promise<void> {
    const {
      transaction_id,
      owner,
      target,
      tags,
      data_size,
      block_height,
      block_timestamp,
      fee,
    } = transaction

    // Classify transaction type based on tags
    const classification = this.classifyTransaction(tags)

    switch (classification.type) {
      case 'arns_name':
        await this.addToBuffer('arns_names', {
          name: classification.data.name,
          owner,
          target: classification.data.target,
          ttl_seconds: classification.data.ttl_seconds || 3600,
          created_at: new Date(block_timestamp * 1000),
          updated_at: new Date(block_timestamp * 1000),
          block_height,
          transaction_id,
        })
        break

      case 'arns_record':
        await this.addToBuffer('arns_records', {
          name: classification.data.name,
          record_type: classification.data.record_type,
          value: classification.data.value,
          ttl: classification.data.ttl || 3600,
          created_at: new Date(block_timestamp * 1000),
          updated_at: new Date(block_timestamp * 1000),
          transaction_id,
        })
        break

      case 'ant_registry':
        await this.addToBuffer('ant_registry', {
          process_id: classification.data.process_id,
          name: classification.data.name,
          owner,
          version: classification.data.version || '1.0.0',
          registered_at: new Date(block_timestamp * 1000),
          transaction_id,
        })
        break

      case 'ao_process':
        await this.addToBuffer('ao_processes', {
          process_id: classification.data.process_id || transaction_id,
          owner,
          module_id: classification.data.module_id,
          scheduler: classification.data.scheduler,
          spawned_at: new Date(block_timestamp * 1000),
          block_height,
          transaction_id,
        })
        break

      case 'ao_message':
        await this.addToBuffer('ao_messages', {
          message_id: transaction_id,
          process_id: classification.data.process_id,
          sender: owner,
          action: classification.data.action,
          data_size,
          created_at: new Date(block_timestamp * 1000),
          block_height,
          transaction_id,
        })
        break

      default:
        // Add to general transactions table
        await this.addToBuffer('transactions', {
          id: transaction_id,
          owner,
          target,
          data_size,
          block_height,
          block_timestamp: new Date(block_timestamp * 1000),
          fee: fee || 0,
          tags: JSON.stringify(tags),
          app_name: this.extractAppName(tags),
        })
    }
  }

  classifyTransaction(tags: Array<Tag>): TransactionClassification {
    const tagMap = new Map(tags.map((tag) => [tag.name, tag.value]))

    // Check for ArNS name registration/update
    if (tagMap.has('Action') && tagMap.get('Action') === 'Buy-Record') {
      return {
        type: 'arns_name',
        data: {
          name: tagMap.get('Name'),
          target: tagMap.get('Target-Id'),
          ttl_seconds: parseInt(tagMap.get('TTL-Seconds') || '3600'),
        },
      }
    }

    // Check for ArNS record updates
    if (tagMap.has('Action') && tagMap.get('Action') === 'Set-Record') {
      return {
        type: 'arns_record',
        data: {
          name: tagMap.get('Name'),
          record_type: tagMap.get('Record-Type') || 'A',
          value: tagMap.get('Value'),
          ttl: parseInt(tagMap.get('TTL') || '3600'),
        },
      }
    }

    // Check for ANT registry
    if (tagMap.has('Action') && tagMap.get('Action') === 'Register') {
      return {
        type: 'ant_registry',
        data: {
          process_id: tagMap.get('Process-Id'),
          name: tagMap.get('Name'),
          version: tagMap.get('Version'),
        },
      }
    }

    // Check for AO process spawn
    if (
      tagMap.has('Data-Protocol') &&
      tagMap.get('Data-Protocol') === 'ao' &&
      tagMap.has('Type') &&
      tagMap.get('Type') === 'Process'
    ) {
      return {
        type: 'ao_process',
        data: {
          process_id: tagMap.get('Process'),
          module_id: tagMap.get('Module'),
          scheduler: tagMap.get('Scheduler'),
        },
      }
    }

    // Check for AO message
    if (
      tagMap.has('Data-Protocol') &&
      tagMap.get('Data-Protocol') === 'ao' &&
      tagMap.has('Type') &&
      tagMap.get('Type') === 'Message'
    ) {
      return {
        type: 'ao_message',
        data: {
          process_id: tagMap.get('Target'),
          action: tagMap.get('Action'),
        },
      }
    }

    return { type: 'general', data: {} }
  }

  async addToBuffer(tableName: string, record: any): Promise<void> {
    const buffer = this.buffers.get(tableName)
    if (!buffer) {
      throw new Error(`Unknown table: ${tableName}`)
    }

    buffer.push(record)

    // Auto-flush if buffer is getting large
    if (buffer.length >= this.batchSize) {
      await this.flushTable(tableName)
    }
  }

  async flushTable(tableName: string): Promise<void> {
    const buffer = this.buffers.get(tableName)
    if (!buffer || buffer.length === 0) return

    const schema = this.schemas.get(tableName)
    const filePath = path.join(this.basePath, `${tableName}.parquet`)

    try {
      // Read existing data if file exists
      let existingData = []
      try {
        const stats = await fs.stat(filePath)
        if (stats.isFile()) {
          existingData = await this.readParquetFile(filePath)
        }
      } catch (err) {
        // File doesn't exist, that's ok
      }

      // Combine existing and new data
      const allData = [...existingData, ...buffer]

      // Write to parquet with compression
      const writer = await ParquetWriter.openFile(schema, filePath, {
        compression: 'GZIP',
        pageSize: 8192,
        rowGroupSize: 50000,
      })

      for (const record of allData) {
        await writer.appendRow(record)
      }

      await writer.close()

      // Clear buffer
      this.buffers.set(tableName, [])

      console.log(
        `✅ Flushed ${buffer.length} records to ${tableName}.parquet (total: ${allData.length})`,
      )
    } catch (error) {
      console.error(`❌ Failed to flush ${tableName}:`, error)
      throw error
    }
  }

  async flushAll(): Promise<void> {
    const promises = Array.from(this.schemas.keys()).map((tableName) =>
      this.flushTable(tableName),
    )
    await Promise.all(promises)
  }

  async readParquetFile(filePath: string): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM read_parquet('${filePath}')`, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
  }

  async getAllFiles(): Promise<Array<string>> {
    const files = []
    for (const tableName of this.schemas.keys()) {
      const filePath = path.join(this.basePath, `${tableName}.parquet`)
      try {
        await fs.access(filePath)
        files.push(filePath)
      } catch {
        // File doesn't exist, skip
      }
    }
    return files
  }

  async getTableStats(): Promise<Record<string, TableStats>> {
    const stats = {}
    for (const tableName of this.schemas.keys()) {
      const filePath = path.join(this.basePath, `${tableName}.parquet`)
      try {
        const fileStats = await fs.stat(filePath)
        const buffer = this.buffers.get(tableName)

        // Get row count from DuckDB
        let rowCount = 0
        try {
          const result = await new Promise((resolve, reject) => {
            this.db.get(
              `SELECT COUNT(*) as count FROM read_parquet('${filePath}')`,
              (err, row) => {
                if (err) reject(err)
                else resolve(row)
              },
            )
          })
          rowCount = result?.count || 0
        } catch {
          // If we can't read the file, that's ok
        }

        stats[tableName] = {
          file_size: fileStats.size,
          row_count: rowCount,
          buffer_count: buffer.length,
          last_modified: fileStats.mtime,
          file_exists: true,
        }
      } catch {
        const buffer = this.buffers.get(tableName)
        stats[tableName] = {
          file_size: 0,
          row_count: 0,
          buffer_count: buffer?.length || 0,
          last_modified: null,
          file_exists: false,
        }
      }
    }
    return stats
  }

  extractAppName(tags: Array<Tag>): string | null {
    const appTag = tags.find((tag) => tag.name === 'App-Name')
    return appTag?.value || null
  }

  async queryTable(
    tableName: string,
    query: string,
    params: Array<any> = [],
  ): Promise<Array<any>> {
    const filePath = path.join(this.basePath, `${tableName}.parquet`)

    return new Promise((resolve, reject) => {
      // Replace table name in query with parquet file path
      const parquetQuery = query.replace(
        new RegExp(`\\b${tableName}\\b`, 'g'),
        `read_parquet('${filePath}')`,
      )

      this.db.all(parquetQuery, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      })
    })
  }
}
