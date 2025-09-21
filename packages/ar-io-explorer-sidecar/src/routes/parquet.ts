import fs from 'node:fs/promises';
import path from 'node:path';
import type { ApiResponse, TableStats } from '@the-permaweb-harlequin/shared-types';
import type { ParquetManager } from '../lib/parquet-manager.js';
import type { Logger } from 'pino';

export function parquetRoutes(router: any, parquetManager: ParquetManager, logger: Logger) {
  
  // Serve individual parquet files
  router.get('/harlequin/parquet/:table', async (ctx) => {
    const { table } = ctx.params;
    const filePath = path.join('./data', `${table}.parquet`);
    
    try {
      const data = await fs.readFile(filePath);
      
      ctx.set('Content-Type', 'application/octet-stream');
      ctx.set('Content-Disposition', `attachment; filename="${table}.parquet"`);
      ctx.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      ctx.body = data;
      
      logger.info(`📤 Served parquet: ${table} (${data.length} bytes)`);
      
    } catch (error) {
      logger.warn(`❌ Parquet file not found: ${table}`);
      ctx.status = 404;
      ctx.body = { 
        ok: false, 
        error: `Table '${table}' not found`,
        available_tables: await parquetManager.getAvailableTables()
      };
    }
  });

  // List all available tables with metadata
  router.get('/harlequin/tables', async (ctx) => {
    try {
      const stats = await parquetManager.getTableStats();
      
      ctx.body = { 
        ok: true, 
        response: {
          tables: stats,
          total_tables: Object.keys(stats).length,
          total_size: Object.values(stats).reduce((sum, table) => sum + table.file_size, 0),
          last_updated: new Date().toISOString()
        }
      };
      
    } catch (error) {
      logger.error(error, 'Failed to get table stats');
      ctx.status = 500;
      ctx.body = { 
        ok: false, 
        error: 'Failed to get table stats',
        message: error.message
      };
    }
  });

  // Query a specific table (for development/testing)
  router.post('/harlequin/query/:table', async (ctx) => {
    const { table } = ctx.params;
    const { query, limit = 100 } = ctx.request.body;
    
    try {
      // Basic security: only allow SELECT queries
      if (!query || !query.trim().toLowerCase().startsWith('select')) {
        ctx.status = 400;
        ctx.body = {
          ok: false,
          error: 'Only SELECT queries are allowed'
        };
        return;
      }

      // Add LIMIT if not present
      let finalQuery = query;
      if (!query.toLowerCase().includes('limit')) {
        finalQuery += ` LIMIT ${Math.min(limit, 1000)}`;
      }

      const results = await parquetManager.queryTable(table, finalQuery);
      
      ctx.body = {
        ok: true,
        response: {
          table,
          query: finalQuery,
          results,
          count: results.length
        }
      };
      
    } catch (error) {
      logger.error(error, `Failed to query table ${table}`);
      ctx.status = 500;
      ctx.body = { 
        ok: false, 
        error: 'Query failed',
        message: error.message
      };
    }
  });

  // Get table schema information
  router.get('/harlequin/schema/:table', async (ctx) => {
    const { table } = ctx.params;
    
    try {
      const filePath = path.join('./data', `${table}.parquet`);
      
      // Check if file exists
      await fs.access(filePath);
      
      // Get schema info using DuckDB
      const schemaQuery = `DESCRIBE SELECT * FROM read_parquet('${filePath}') LIMIT 1`;
      const schema = await parquetManager.queryTable(table, schemaQuery);
      
      ctx.body = {
        ok: true,
        response: {
          table,
          schema,
          file_path: filePath
        }
      };
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        ctx.status = 404;
        ctx.body = { 
          ok: false, 
          error: `Table '${table}' not found`
        };
      } else {
        logger.error(error, `Failed to get schema for table ${table}`);
        ctx.status = 500;
        ctx.body = { 
          ok: false, 
          error: 'Failed to get table schema',
          message: error.message
        };
      }
    }
  });

  // Download all parquet files as a zip (for backup/migration)
  router.get('/harlequin/download/all', async (ctx) => {
    try {
      const files = await parquetManager.getAllFiles();
      
      if (files.length === 0) {
        ctx.status = 404;
        ctx.body = {
          ok: false,
          error: 'No parquet files available'
        };
        return;
      }

      // For now, just return the list of available files
      // In a full implementation, you'd create a zip archive
      ctx.body = {
        ok: true,
        response: {
          message: 'Available files for download',
          files: files.map(f => ({
            name: path.basename(f),
            path: f,
            download_url: `/harlequin/parquet/${path.basename(f, '.parquet')}`
          })),
          total_files: files.length
        }
      };
      
    } catch (error) {
      logger.error(error, 'Failed to prepare download');
      ctx.status = 500;
      ctx.body = { 
        ok: false, 
        error: 'Failed to prepare download',
        message: error.message
      };
    }
  });

  // Get parquet file metadata without downloading
  router.get('/harlequin/metadata/:table', async (ctx) => {
    const { table } = ctx.params;
    const filePath = path.join('./data', `${table}.parquet`);
    
    try {
      const stats = await fs.stat(filePath);
      const tableStats = await parquetManager.getTableStats();
      
      ctx.body = {
        ok: true,
        response: {
          table,
          file_size: stats.size,
          created_at: stats.birthtime,
          modified_at: stats.mtime,
          ...tableStats[table]
        }
      };
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        ctx.status = 404;
        ctx.body = { 
          ok: false, 
          error: `Table '${table}' not found`
        };
      } else {
        logger.error(error, `Failed to get metadata for table ${table}`);
        ctx.status = 500;
        ctx.body = { 
          ok: false, 
          error: 'Failed to get table metadata',
          message: error.message
        };
      }
    }
  });
}
