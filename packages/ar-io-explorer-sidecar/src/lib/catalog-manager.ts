import type {
  CatalogInfo,
  DataCatalog,
  WalletBalance,
  _TableInfo,
} from '@the-permaweb-harlequin/shared-types'
import Arweave from 'arweave'
import fs from 'node:fs/promises'
import path from 'node:path'

export class CatalogManager {
  private arweave: Arweave | null = null
  private wallet: any = null
  private arnsName: string
  private walletPath: string

  constructor() {
    this.arnsName = process.env.ARNS_NAME || 'harlequin-data'
    this.walletPath = process.env.ARWEAVE_WALLET_PATH || './config/wallet.json'
  }

  async init(): Promise<void> {
    // Initialize Arweave client
    this.arweave = Arweave.init({
      host: process.env.ARWEAVE_HOST || 'arweave.net',
      port: parseInt(process.env.ARWEAVE_PORT) || 443,
      protocol: process.env.ARWEAVE_PROTOCOL || 'https',
    })

    // Load wallet if available
    try {
      const walletData = await fs.readFile(this.walletPath, 'utf8')
      this.wallet = JSON.parse(walletData)

      const address = await this.arweave.wallets.jwkToAddress(this.wallet)
      console.log(`🔑 Loaded wallet: ${address}`)
    } catch (error) {
      console.warn(
        '⚠️  No wallet found, checkpoint deployment will be disabled',
      )
      console.warn(`   Expected wallet at: ${this.walletPath}`)
    }

    console.log(`📋 CatalogManager initialized for ArNS: ${this.arnsName}`)
  }

  async createCheckpoint(parquetFiles: Array<string>): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet available for checkpoint deployment')
    }

    const catalog = await this.buildDataCatalog(parquetFiles)

    // Upload each parquet file to Arweave
    const uploadPromises = parquetFiles.map((filePath) =>
      this.uploadParquetFile(filePath),
    )
    const uploadResults = await Promise.all(uploadPromises)

    // Update catalog with Arweave transaction IDs
    for (let i = 0; i < parquetFiles.length; i++) {
      const tableName = this.extractTableName(parquetFiles[i])
      if (catalog.tables[tableName]) {
        catalog.tables[tableName].arweave_id = uploadResults[i]
      }
    }

    // Upload catalog to Arweave
    const catalogTxId = await this.uploadCatalog(catalog)

    // Update ArNS name to point to new catalog (if configured)
    if (process.env.AUTO_UPDATE_ARNS === 'true') {
      await this.updateArnsPointer(catalogTxId)
    }

    console.log(`✅ Checkpoint created successfully: ${catalogTxId}`)
    return catalogTxId
  }

  async buildDataCatalog(parquetFiles: Array<string>): Promise<DataCatalog> {
    const catalog = {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      last_updated: Math.floor(Date.now() / 1000),
      service: 'harlequin-sidecar',
      tables: {},
    }

    for (const filePath of parquetFiles) {
      const tableName = this.extractTableName(filePath)
      const stats = await fs.stat(filePath)

      // Get row count (this would require reading the parquet file)
      // For now, we'll estimate or use a placeholder
      const rowCount = await this.getParquetRowCount(filePath)

      catalog.tables[tableName] = {
        name: tableName,
        arweave_id: '', // Will be filled after upload
        schema_version: '1.0.0',
        row_count: rowCount,
        file_size: stats.size,
        last_checkpoint: Math.floor(Date.now() / 1000),
        created_at: stats.birthtime.toISOString(),
        updated_at: stats.mtime.toISOString(),
        partitions: [], // TODO: Add partition support
        compression: 'gzip',
        format: 'parquet',
      }
    }

    return catalog
  }

  async uploadParquetFile(filePath: string): Promise<string> {
    const tableName = this.extractTableName(filePath)
    const fileData = await fs.readFile(filePath)

    console.log(
      `📤 Uploading ${tableName} to Arweave (${fileData.length} bytes)...`,
    )

    const transaction = await this.arweave.createTransaction(
      {
        data: fileData,
      },
      this.wallet,
    )

    // Add tags
    transaction.addTag('Content-Type', 'application/octet-stream')
    transaction.addTag('App-Name', 'Harlequin-Parquet')
    transaction.addTag('Table-Name', tableName)
    transaction.addTag('Data-Format', 'parquet')
    transaction.addTag('Service', 'harlequin-sidecar')
    transaction.addTag('Version', '1.0.0')
    transaction.addTag('Created-At', new Date().toISOString())

    await this.arweave.transactions.sign(transaction, this.wallet)
    await this.arweave.transactions.post(transaction)

    console.log(`✅ Uploaded ${tableName}: ${transaction.id}`)
    return transaction.id
  }

  async uploadCatalog(catalog: DataCatalog): Promise<string> {
    const catalogJson = JSON.stringify(catalog, null, 2)
    const catalogData = Buffer.from(catalogJson, 'utf8')

    console.log(
      `📤 Uploading catalog to Arweave (${catalogData.length} bytes)...`,
    )

    const transaction = await this.arweave.createTransaction(
      {
        data: catalogData,
      },
      this.wallet,
    )

    // Add tags
    transaction.addTag('Content-Type', 'application/json')
    transaction.addTag('App-Name', 'Harlequin-Catalog')
    transaction.addTag('Data-Type', 'catalog')
    transaction.addTag('Service', 'harlequin-sidecar')
    transaction.addTag('Version', catalog.version)
    transaction.addTag('Created-At', catalog.created_at)
    transaction.addTag(
      'Table-Count',
      Object.keys(catalog.tables).length.toString(),
    )

    await this.arweave.transactions.sign(transaction, this.wallet)
    await this.arweave.transactions.post(transaction)

    console.log(`✅ Uploaded catalog: ${transaction.id}`)
    return transaction.id
  }

  async updateArnsPointer(catalogTxId: string): Promise<string> {
    // This would require integration with AR.IO contract
    // For now, we'll just log the intention
    console.log(`🔄 Would update ArNS name ${this.arnsName} -> ${catalogTxId}`)

    // TODO: Implement AR.IO contract interaction
    // This would involve:
    // 1. Creating a transaction to update the ArNS record
    // 2. Setting the target to the catalog transaction ID
    // 3. Setting appropriate TTL

    return catalogTxId
  }

  extractTableName(filePath: string): string {
    const basename = path.basename(filePath)
    return basename.replace('.parquet', '')
  }

  async getParquetRowCount(filePath: string): Promise<number> {
    // This is a placeholder - in a real implementation you'd read the parquet metadata
    // For now, estimate based on file size (rough approximation)
    const stats = await fs.stat(filePath)
    const estimatedRowSize = 100 // bytes per row estimate
    return Math.floor(stats.size / estimatedRowSize)
  }

  async getCatalogInfo(): Promise<CatalogInfo> {
    return {
      arns_name: this.arnsName,
      wallet_loaded: !!this.wallet,
      wallet_address: this.wallet
        ? await this.arweave.wallets.jwkToAddress(this.wallet)
        : null,
      arweave_host: this.arweave?.api?.config?.host || 'not configured',
    }
  }

  async getWalletBalance(): Promise<WalletBalance | null> {
    if (!this.wallet) {
      return null
    }

    try {
      const address = await this.arweave.wallets.jwkToAddress(this.wallet)
      const balance = await this.arweave.wallets.getBalance(address)
      return {
        address,
        balance: this.arweave.ar.winstonToAr(balance),
        winston: balance,
      }
    } catch (error) {
      console.error('Failed to get wallet balance:', error)
      return null
    }
  }
}
