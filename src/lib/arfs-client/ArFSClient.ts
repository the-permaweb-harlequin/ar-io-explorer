import { type Logger, createLogger } from '@/lib/logger'
import type { ParquetClient } from '@/lib/parquet-client'

import type { ArFSDrive, ArFSDriveMetadata, ArFSQueryOptions } from './types'

export class ArFSClient {
  private parquetClient: ParquetClient
  private logger: Logger

  constructor(parquetClient: ParquetClient) {
    this.parquetClient = parquetClient
    this.logger = createLogger('ArFSClient') // Back to normal logging
  }

  /**
   * Get ArFS drives with their metadata
   */
  async getDrives(options: ArFSQueryOptions = {}): Promise<ArFSDrive[]> {
    this.logger.info('Fetching ArFS drives', options)

    const {
      limit = 100,
      offset = 0,
      driveId,
      owner,
      privacy,
      arfsVersion,
      orderBy = 'height',
      orderDirection = 'DESC',
    } = options

    // Build tag filters for ArFS drives
    const tagFilters = [{ name: 'Entity-Type', value: 'drive' }]

    // Add optional filters
    if (driveId) {
      tagFilters.push({ name: 'Drive-Id', value: driveId })
    }
    if (privacy) {
      tagFilters.push({ name: 'Drive-Privacy', value: privacy })
    }
    if (arfsVersion) {
      tagFilters.push({ name: 'ArFS', value: arfsVersion })
    }

    // Query transactions with ArFS drive tags
    // Get a larger set to ensure we have all revisions, then filter to latest
    const transactions = await this.parquetClient.getTransactionsByTags(
      tagFilters,
      {
        limit: limit * 10, // Get more transactions to account for multiple revisions
        offset,
        orderBy,
        orderDirection,
        owner,
      },
    )

    // Process each transaction to extract ArFS drive data
    const allDrives: ArFSDrive[] = []

    this.logger.time('getDrives')
    this.logger.debug(
      `Processing ${transactions.length} transactions for ArFS drives`,
    )

    for (const transaction of transactions) {
      try {
        const drive = this.processArFSDrive(transaction)
        if (drive) {
          allDrives.push(drive)
        }
      } catch (error) {
        this.logger.warn(
          `Failed to process ArFS drive ${transaction.id}`,
          error,
        )
        // Continue processing other drives
      }
    }

    this.logger.debug(`Processed ${allDrives.length} valid ArFS drives`)

    // Group by driveId and get the latest revision for each drive
    const latestDrives = this.getLatestDriveRevisions(allDrives)

    this.logger.info(
      `Found ${latestDrives.length} unique ArFS drives (latest revisions)`,
    )
    this.logger.timeEnd('getDrives')

    // Apply limit after getting latest revisions
    return latestDrives.slice(0, limit)
  }

  /**
   * Get a specific ArFS drive by its Drive-Id
   */
  async getDriveById(
    driveId: string,
    owner: string,
  ): Promise<ArFSDrive | null> {
    this.logger.info(`Fetching specific ArFS drive`, { driveId, owner })
    const drives = await this.getDrives({ driveId, owner, limit: 1 })
    const result = drives[0] || null
    this.logger.debug(`Drive ${driveId} ${result ? 'found' : 'not found'}`)
    return result
  }

  /**
   * Get ArFS drives by owner
   */
  async getDrivesByOwner(
    owner: string,
    options: ArFSQueryOptions = {},
  ): Promise<ArFSDrive[]> {
    return this.getDrives({
      ...options,
      owner,
    })
  }

  /**
   * Get all revisions of a specific drive (for debugging/history)
   */
  async getDriveRevisions(
    driveId: string,
    owner?: string,
  ): Promise<ArFSDrive[]> {
    const tagFilters = [
      { name: 'Entity-Type', value: 'drive' },
      { name: 'Drive-Id', value: driveId },
    ]

    const transactions = await this.parquetClient.getTransactionsByTags(
      tagFilters,
      {
        limit: 1000, // Get all revisions
        orderBy: 'height',
        orderDirection: 'DESC',
        owner,
      },
    )

    const revisions: ArFSDrive[] = []
    for (const transaction of transactions) {
      try {
        const drive = await this.processArFSDrive(transaction)
        if (drive) {
          revisions.push(drive)
        }
      } catch (error) {
        console.warn(
          `Failed to process drive revision ${transaction.id}:`,
          error,
        )
      }
    }

    return revisions
  }

  /**
   * Process a transaction with ArFS drive tags into an ArFSDrive object
   */
  private processArFSDrive(transaction: any): ArFSDrive | null {
    this.logger.debug(`Processing transaction ${transaction.id}`, {
      transactionId: transaction.id,
      tagCount: transaction.tags?.length || 0,
    })

    // Convert tags array to object for easier access
    const tagsObj = transaction.tags.reduce(
      (acc: Record<string, string>, tag: any) => {
        acc[tag.tag_name] = tag.tag_value
        return acc
      },
      {},
    )

    this.logger.debug(`Transaction ${transaction.id} tags:`, tagsObj)

    // Validate required ArFS drive tags
    const requiredTags = [
      'Entity-Type',
      'Drive-Id',
      'Drive-Privacy',
      'ArFS',
      'Unix-Time',
      'Content-Type',
    ]
    const missingTags = requiredTags.filter((tag) => !tagsObj[tag])

    if (
      tagsObj['Entity-Type'] !== 'drive' ||
      !tagsObj['Drive-Id'] ||
      !tagsObj['Drive-Privacy'] ||
      !tagsObj['ArFS'] ||
      !tagsObj['Unix-Time'] ||
      !tagsObj['Content-Type']
    ) {
      this.logger.debug(
        `Transaction ${transaction.id} rejected - missing required tags:`,
        {
          entityType: tagsObj['Entity-Type'],
          driveId: tagsObj['Drive-Id'],
          drivePrivacy: tagsObj['Drive-Privacy'],
          arfs: tagsObj['ArFS'],
          unixTime: tagsObj['Unix-Time'],
          contentType: tagsObj['Content-Type'],
          missingTags,
        },
      )
      return null
    }

    // Parse metadata from transaction data if available
    let metadata: ArFSDriveMetadata | undefined
    if (transaction.data_size > 0) {
      try {
        // Note: In a real implementation, you'd fetch the transaction data
        // For now, we'll leave metadata as undefined since we don't have data access
        // metadata = await this.fetchTransactionData(transaction.id)
      } catch (error) {
        console.warn(
          `Failed to fetch metadata for drive ${transaction.id}:`,
          error,
        )
      }
    }

    // Build ArFS drive object
    const drive: ArFSDrive = {
      // Transaction info
      id: transaction.id,
      owner: transaction.owner,
      height: transaction.height,
      indexed_at: transaction.indexed_at,
      data_size: transaction.data_size,

      // ArFS-specific data
      driveId: tagsObj['Drive-Id'],
      privacy: tagsObj['Drive-Privacy'] as 'public' | 'private',
      arfsVersion: tagsObj['ArFS'],
      unixTime: parseInt(tagsObj['Unix-Time'], 10),
      contentType: tagsObj['Content-Type'] as
        | 'application/json'
        | 'application/octet-stream',

      // Optional fields
      cipher: tagsObj['Cipher'],
      cipherIV: tagsObj['Cipher-IV'],
      authMode: tagsObj['Drive-Auth-Mode'] as 'password' | undefined,
      signatureType: tagsObj['Signature-Type'] as '1' | undefined,

      // Metadata
      metadata,

      // Raw tags for debugging
      tags: tagsObj,
    }

    this.logger.debug(`Successfully processed ArFS drive ${drive.driveId}`, {
      driveId: drive.driveId,
      privacy: drive.privacy,
      arfsVersion: drive.arfsVersion,
      transactionId: drive.id,
    })

    return drive
  }

  /**
   * Get unique ArFS versions in the dataset
   */
  async getArFSVersions(): Promise<string[]> {
    return this.parquetClient.getTagValues('ArFS')
  }

  /**
   * Get drive privacy distribution
   */
  async getDrivePrivacyStats(): Promise<Record<'public' | 'private', number>> {
    const drives = await this.getDrives({ limit: 10000 }) // Get a large sample

    const stats = drives.reduce(
      (acc, drive) => {
        acc[drive.privacy] = (acc[drive.privacy] || 0) + 1
        return acc
      },
      { public: 0, private: 0 } as Record<'public' | 'private', number>,
    )

    return stats
  }

  /**
   * Get drives created in a time range
   */
  async getDrivesByTimeRange(
    startTime: number,
    endTime: number,
    options: ArFSQueryOptions = {},
  ): Promise<ArFSDrive[]> {
    const drives = await this.getDrives({
      ...options,
      limit: options.limit || 10000,
    })

    return drives.filter(
      (drive) => drive.unixTime >= startTime && drive.unixTime <= endTime,
    )
  }

  /**
   * Get the latest revision for each drive by grouping by driveId
   * and selecting the one with the highest height (most recent)
   */
  private getLatestDriveRevisions(drives: ArFSDrive[]): ArFSDrive[] {
    const driveMap = new Map<string, ArFSDrive>()

    for (const drive of drives) {
      const existing = driveMap.get(drive.driveId)

      if (!existing || drive.height > existing.height) {
        // This revision is newer (higher block height)
        driveMap.set(drive.driveId, drive)
      } else if (
        drive.height === existing.height &&
        drive.unixTime > existing.unixTime
      ) {
        // Same block height, use unix time as tiebreaker
        driveMap.set(drive.driveId, drive)
      }
    }

    // Return drives sorted by height (newest first)
    return Array.from(driveMap.values()).sort((a, b) => {
      if (a.height !== b.height) {
        return Number(b.height - a.height)
      }
      return b.unixTime - a.unixTime
    })
  }
}
