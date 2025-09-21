import type { ApiResponse, CatalogInfo, WalletBalance, ValidationResult } from '@the-permaweb-harlequin/shared-types';
import type { CatalogManager } from '../lib/catalog-manager.js';
import type { Logger } from 'pino';

export function catalogRoutes(router: any, catalogManager: CatalogManager, logger: Logger) {
  
  // Get current catalog information
  router.get('/harlequin/catalog', async (ctx) => {
    try {
      const catalogInfo = await catalogManager.getCatalogInfo();
      
      ctx.body = {
        ok: true,
        response: {
          ...catalogInfo,
          endpoints: {
            info: '/harlequin/catalog',
            balance: '/harlequin/catalog/balance',
            deploy: '/harlequin/catalog/deploy'
          }
        }
      };
      
    } catch (error) {
      logger.error(error, 'Failed to get catalog info');
      ctx.status = 500;
      ctx.body = { 
        ok: false, 
        error: 'Failed to get catalog info',
        message: error.message
      };
    }
  });

  // Get wallet balance information
  router.get('/harlequin/catalog/balance', async (ctx) => {
    try {
      const balance = await catalogManager.getWalletBalance();
      
      if (!balance) {
        ctx.status = 404;
        ctx.body = {
          ok: false,
          error: 'No wallet configured'
        };
        return;
      }

      ctx.body = {
        ok: true,
        response: balance
      };
      
    } catch (error) {
      logger.error(error, 'Failed to get wallet balance');
      ctx.status = 500;
      ctx.body = { 
        ok: false, 
        error: 'Failed to get wallet balance',
        message: error.message
      };
    }
  });

  // Manual catalog deployment
  router.post('/harlequin/catalog/deploy', async (ctx) => {
    try {
      logger.info('🚀 Manual catalog deployment triggered');
      
      // This would typically be called by the checkpoint process
      // For manual deployment, we'll just return the deployment status
      const catalogInfo = await catalogManager.getCatalogInfo();
      
      if (!catalogInfo.wallet_loaded) {
        ctx.status = 400;
        ctx.body = {
          ok: false,
          error: 'No wallet configured for deployment'
        };
        return;
      }

      ctx.body = {
        ok: true,
        response: {
          message: 'Catalog deployment would be triggered here',
          wallet_address: catalogInfo.wallet_address,
          arns_name: catalogInfo.arns_name,
          note: 'Use /checkpoint endpoint to trigger full deployment'
        }
      };
      
    } catch (error) {
      logger.error(error, 'Failed to deploy catalog');
      ctx.status = 500;
      ctx.body = { 
        ok: false, 
        error: 'Failed to deploy catalog',
        message: error.message
      };
    }
  });

  // Get deployment history (placeholder)
  router.get('/harlequin/catalog/history', async (ctx) => {
    try {
      // This would typically read from a deployment log or database
      // For now, return a placeholder response
      
      ctx.body = {
        ok: true,
        response: {
          deployments: [],
          total_deployments: 0,
          last_deployment: null,
          note: 'Deployment history tracking not yet implemented'
        }
      };
      
    } catch (error) {
      logger.error(error, 'Failed to get deployment history');
      ctx.status = 500;
      ctx.body = { 
        ok: false, 
        error: 'Failed to get deployment history',
        message: error.message
      };
    }
  });

  // Validate ArNS configuration
  router.get('/harlequin/catalog/validate', async (ctx) => {
    try {
      const catalogInfo = await catalogManager.getCatalogInfo();
      const balance = await catalogManager.getWalletBalance();
      
      const validation = {
        wallet_configured: catalogInfo.wallet_loaded,
        wallet_address: catalogInfo.wallet_address,
        arns_name: catalogInfo.arns_name,
        arweave_connection: catalogInfo.arweave_host !== 'not configured',
        sufficient_balance: balance ? parseFloat(balance.balance) > 0.01 : false, // Minimum 0.01 AR
        ready_for_deployment: false
      };

      validation.ready_for_deployment = validation.wallet_configured && 
                                       validation.arweave_connection && 
                                       validation.sufficient_balance;

      ctx.body = {
        ok: true,
        response: {
          validation,
          balance: balance,
          recommendations: validation.ready_for_deployment ? 
            ['Configuration is valid for deployment'] :
            [
              !validation.wallet_configured ? 'Configure wallet at ARWEAVE_WALLET_PATH' : null,
              !validation.arweave_connection ? 'Check Arweave connection settings' : null,
              !validation.sufficient_balance ? 'Insufficient AR balance for deployment' : null
            ].filter(Boolean)
        }
      };
      
    } catch (error) {
      logger.error(error, 'Failed to validate catalog configuration');
      ctx.status = 500;
      ctx.body = { 
        ok: false, 
        error: 'Failed to validate configuration',
        message: error.message
      };
    }
  });
}
