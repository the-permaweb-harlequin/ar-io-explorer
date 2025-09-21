import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import serve from 'koa-static';
import cron from 'node-cron';
import pino from 'pino';
import dotenv from 'dotenv';

import { ParquetManager } from './lib/parquet-manager.js';
import { CatalogManager } from './lib/catalog-manager.js';
import { webhookRoutes } from './routes/webhook.js';
import { parquetRoutes } from './routes/parquet.js';
import { catalogRoutes } from './routes/catalog.js';
import type { ApiResponse, HealthResponse } from '@the-permaweb-harlequin/shared-types';

// Load environment variables
dotenv.config();

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { 
      colorize: true,
      translateTime: 'SYS:standard'
    }
  }
});

class HarlequinSidecar {
  public app: Koa;
  public router: Router;
  public parquetManager: ParquetManager;
  public catalogManager: CatalogManager;
  public logger: pino.Logger;

  constructor() {
    this.app = new Koa();
    this.router = new Router();
    this.parquetManager = new ParquetManager();
    this.catalogManager = new CatalogManager();
    this.logger = logger;
  }

  async init(): Promise<void> {
    this.logger.info('🎭 Initializing Harlequin Sidecar...');

    // Initialize managers
    await this.parquetManager.init();
    await this.catalogManager.init();

    // Setup middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();

    // Setup cron jobs
    this.setupCronJobs();

    // Serve static parquet files
    this.app.use(serve('./data'));

    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());

    this.logger.info('✅ Harlequin Sidecar initialized successfully');
  }

  setupMiddleware(): void {
    // CORS
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Accept']
    }));

    // Body parser
    this.app.use(bodyParser({
      jsonLimit: '10mb',
      textLimit: '10mb',
      enableTypes: ['json', 'form', 'text']
    }));

    // Request logging
    this.app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      this.logger.info(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
    });

    // Error handling
    this.app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        const error = err as any;
        ctx.status = error.status || 500;
        ctx.body = { 
          ok: false, 
          error: error.message,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        };
        this.logger.error(error, 'Request error');
      }
    });
  }

  setupRoutes(): void {
    // Webhook routes
    webhookRoutes(this.router, this.parquetManager, this.logger);
    
    // Parquet serving routes
    parquetRoutes(this.router, this.parquetManager, this.logger);
    
    // Catalog routes
    catalogRoutes(this.router, this.catalogManager, this.logger);

    // Health check
    this.router.get('/health', async (ctx) => {
      const stats = await this.parquetManager.getTableStats();
      const response: ApiResponse<HealthResponse> = { 
        ok: true,
        response: {
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          tables: stats
        }
      };
      ctx.body = response;
    });

    // Root endpoint
    this.router.get('/', (ctx) => {
      const response: ApiResponse = {
        ok: true,
        response: {
          service: 'Harlequin AR.IO Explorer Sidecar',
          version: '1.0.0',
          endpoints: {
            health: '/health',
            webhook: '/webhook/transaction',
            parquet: '/harlequin/parquet/:table',
            catalog: '/harlequin/catalog',
            tables: '/harlequin/tables'
          }
        }
      };
      ctx.body = response;
    });
  }

  setupCronJobs(): void {
    const checkpointInterval = process.env.CHECKPOINT_INTERVAL || '0 2 * * *'; // Default: 2 AM UTC
    const flushInterval = process.env.FLUSH_INTERVAL || '*/5 * * * *'; // Default: Every 5 minutes

    // Daily checkpoint
    cron.schedule(checkpointInterval, async () => {
      this.logger.info('🕐 Starting scheduled checkpoint...');
      try {
        await this.createCheckpoint();
        this.logger.info('✅ Scheduled checkpoint completed');
      } catch (error) {
        this.logger.error(error, '❌ Scheduled checkpoint failed');
      }
    });

    // Flush parquet buffers
    cron.schedule(flushInterval, async () => {
      try {
        await this.parquetManager.flushAll();
        this.logger.debug('💾 Flushed parquet buffers');
      } catch (error) {
        this.logger.error(error, 'Failed to flush buffers');
      }
    });

    this.logger.info(`📅 Scheduled checkpoint: ${checkpointInterval}`);
    this.logger.info(`💾 Scheduled flush: ${flushInterval}`);
  }

  async createCheckpoint(): Promise<string | null> {
    try {
      // Flush all pending data first
      await this.parquetManager.flushAll();
      
      // Get all parquet files
      const parquetFiles = await this.parquetManager.getAllFiles();
      
      if (parquetFiles.length === 0) {
        this.logger.warn('No parquet files to checkpoint');
        return null;
      }

      // Create checkpoint via catalog manager
      const catalogTxId = await this.catalogManager.createCheckpoint(parquetFiles);
      
      this.logger.info(`📊 Checkpoint created successfully: ${catalogTxId}`);
      return catalogTxId;
    } catch (error) {
      this.logger.error(error, 'Failed to create checkpoint');
      throw error;
    }
  }

  start(port: number = 3001): void {
    const serverPort = process.env.PORT || port;
    
    this.app.listen(serverPort, () => {
      this.logger.info(`🎭 Harlequin Sidecar listening on port ${serverPort}`);
      this.logger.info(`🌐 Health check: http://localhost:${serverPort}/health`);
      this.logger.info(`📊 Parquet endpoint: http://localhost:${serverPort}/harlequin/parquet/:table`);
    });
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const sidecar = new HarlequinSidecar();

try {
  await sidecar.init();
  sidecar.start();
} catch (error) {
  logger.error(error, '💥 Failed to start Harlequin Sidecar');
  process.exit(1);
}
