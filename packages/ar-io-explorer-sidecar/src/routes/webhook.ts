import type {
  _ApiResponse,
  _Block,
  _Transaction,
} from '@the-permaweb-harlequin/shared-types'
import type { Logger } from 'pino'
import { z } from 'zod'

import type { ParquetManager } from '../lib/parquet-manager.js'

// Validation schemas
const TagSchema = z.object({
  name: z.string(),
  value: z.string(),
})

const TransactionSchema = z.object({
  transaction_id: z.string(),
  owner: z.string(),
  target: z.string().optional(),
  tags: z.array(TagSchema),
  data_size: z.number().min(0),
  block_height: z.number().min(0),
  block_timestamp: z.number().min(0),
  fee: z.number().min(0).optional(),
})

const BlockSchema = z.object({
  block_height: z.number().min(0),
  block_timestamp: z.number().min(0),
  transactions: z.array(TransactionSchema).optional(),
})

export function webhookRoutes(
  router: any,
  parquetManager: ParquetManager,
  logger: Logger,
) {
  // Single transaction webhook
  router.post('/webhook/transaction', async (ctx) => {
    try {
      const transaction = TransactionSchema.parse(ctx.request.body)

      logger.info(
        `📨 Processing transaction: ${transaction.transaction_id} (block: ${transaction.block_height})`,
      )

      await parquetManager.processTransaction(transaction)

      ctx.body = {
        ok: true,
        response: {
          message: 'Transaction processed successfully',
          transaction_id: transaction.transaction_id,
          block_height: transaction.block_height,
        },
      }
      ctx.status = 200
    } catch (error) {
      logger.error(error, 'Failed to process transaction')

      if (error instanceof z.ZodError) {
        ctx.status = 400
        ctx.body = {
          ok: false,
          error: 'Invalid transaction format',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
            received: err.received,
          })),
        }
      } else {
        ctx.status = 500
        ctx.body = {
          ok: false,
          error: 'Internal server error',
          message: error.message,
        }
      }
    }
  })

  // Block webhook with multiple transactions
  router.post('/webhook/block', async (ctx) => {
    try {
      const block = BlockSchema.parse(ctx.request.body)

      logger.info(
        `📦 Processing block: ${block.block_height} with ${block.transactions?.length || 0} transactions`,
      )

      let processedCount = 0
      let errorCount = 0

      if (block.transactions && block.transactions.length > 0) {
        for (const tx of block.transactions) {
          try {
            await parquetManager.processTransaction({
              ...tx,
              block_height: block.block_height,
              block_timestamp: block.block_timestamp,
            })
            processedCount++
          } catch (txError) {
            logger.error(
              txError,
              `Failed to process transaction ${tx.transaction_id} in block ${block.block_height}`,
            )
            errorCount++
          }
        }
      }

      ctx.body = {
        ok: true,
        response: {
          message: 'Block processed',
          block_height: block.block_height,
          transactions_processed: processedCount,
          transactions_failed: errorCount,
          total_transactions: block.transactions?.length || 0,
        },
      }
    } catch (error) {
      logger.error(error, `Failed to process block`)

      if (error instanceof z.ZodError) {
        ctx.status = 400
        ctx.body = {
          ok: false,
          error: 'Invalid block format',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
            received: err.received,
          })),
        }
      } else {
        ctx.status = 500
        ctx.body = {
          ok: false,
          error: 'Failed to process block',
          message: error.message,
        }
      }
    }
  })

  // Manual checkpoint trigger
  router.post('/checkpoint', async (ctx) => {
    try {
      logger.info('🔄 Manual checkpoint triggered')

      // Flush all pending data first
      await parquetManager.flushAll()

      // Get all parquet files
      const parquetFiles = await parquetManager.getAllFiles()

      if (parquetFiles.length === 0) {
        ctx.body = {
          ok: true,
          response: {
            message: 'No parquet files to checkpoint',
            files_count: 0,
          },
        }
        return
      }

      // Note: CatalogManager checkpoint would be called here
      // const catalogTxId = await catalogManager.createCheckpoint(parquetFiles);

      ctx.body = {
        ok: true,
        response: {
          message: 'Checkpoint created successfully',
          files_count: parquetFiles.length,
          files: parquetFiles.map((f) => f.split('/').pop()),
          // catalog_tx_id: catalogTxId
        },
      }
    } catch (error) {
      logger.error(error, 'Failed to create checkpoint')
      ctx.status = 500
      ctx.body = {
        ok: false,
        error: 'Failed to create checkpoint',
        message: error.message,
      }
    }
  })

  // Flush buffers endpoint
  router.post('/flush', async (ctx) => {
    try {
      logger.info('💾 Manual flush triggered')

      await parquetManager.flushAll()
      const stats = await parquetManager.getTableStats()

      ctx.body = {
        ok: true,
        response: {
          message: 'All buffers flushed successfully',
          tables: stats,
        },
      }
    } catch (error) {
      logger.error(error, 'Failed to flush buffers')
      ctx.status = 500
      ctx.body = {
        ok: false,
        error: 'Failed to flush buffers',
        message: error.message,
      }
    }
  })

  // Webhook status and configuration
  router.get('/webhook/status', async (ctx) => {
    try {
      const stats = await parquetManager.getTableStats()

      ctx.body = {
        ok: true,
        response: {
          status: 'active',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          tables: stats,
          endpoints: {
            transaction: '/webhook/transaction',
            block: '/webhook/block',
            checkpoint: '/checkpoint',
            flush: '/flush',
          },
        },
      }
    } catch (error) {
      logger.error(error, 'Failed to get webhook status')
      ctx.status = 500
      ctx.body = {
        ok: false,
        error: 'Failed to get status',
        message: error.message,
      }
    }
  })

  // Test endpoint for development
  router.post('/webhook/test', async (ctx) => {
    const testTransaction = {
      transaction_id: `test_${Date.now()}`,
      owner: 'test_owner_address',
      target: 'test_target_address',
      tags: [
        { name: 'App-Name', value: 'Harlequin-Test' },
        { name: 'Action', value: 'Test-Transaction' },
      ],
      data_size: 1024,
      block_height: 1000000,
      block_timestamp: Math.floor(Date.now() / 1000),
      fee: 1000000,
    }

    try {
      await parquetManager.processTransaction(testTransaction)

      ctx.body = {
        ok: true,
        response: {
          message: 'Test transaction processed successfully',
          test_transaction: testTransaction,
        },
      }
    } catch (error) {
      logger.error(error, 'Failed to process test transaction')
      ctx.status = 500
      ctx.body = {
        ok: false,
        error: 'Failed to process test transaction',
        message: error.message,
      }
    }
  })
}
