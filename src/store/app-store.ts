import { openDB } from 'idb'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  DEFAULT_ARIO_PROCESS_ID,
  DEFAULT_CU_URL,
  DEFAULT_DATABASE_URL,
  DEFAULT_GATEWAY_URL,
  DEFAULT_HYPERBEAM_NODE_URL,
  DEFAULT_TURBO_PAYMENT_URL,
  DEFAULT_TURBO_UPLOAD_URL,
} from '@/constants'

// Theme type
export type Theme = 'light' | 'dark' | 'system'

// Configuration settings interface
export interface AppConfig {
  gatewayUrl: string
  databaseUrl: string
  cuUrl: string
  hyperbeamNodeUrl: string
  turboPaymentUrl: string
  turboUploadUrl: string
  arioProcessId: string
  useLocalNode?: boolean // Flag to indicate if local node should be used
}

// Check if we're in development mode and have local AR-IO node available
const isLocalDevelopment = () => {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  )
}

// Local development configuration
export const localConfig: AppConfig = {
  gatewayUrl: DEFAULT_GATEWAY_URL,
  databaseUrl: DEFAULT_DATABASE_URL,
  cuUrl: DEFAULT_CU_URL,
  hyperbeamNodeUrl: DEFAULT_HYPERBEAM_NODE_URL, // Use public endpoint for now
  turboPaymentUrl: DEFAULT_TURBO_PAYMENT_URL,
  turboUploadUrl: DEFAULT_TURBO_UPLOAD_URL,
  arioProcessId: DEFAULT_ARIO_PROCESS_ID,
  useLocalNode: true,
}
// Production configuration values

export const productionConfig: AppConfig = {
  gatewayUrl: DEFAULT_GATEWAY_URL,
  databaseUrl: DEFAULT_DATABASE_URL,
  cuUrl: DEFAULT_CU_URL,
  hyperbeamNodeUrl: DEFAULT_HYPERBEAM_NODE_URL,
  turboPaymentUrl: DEFAULT_TURBO_PAYMENT_URL,
  turboUploadUrl: DEFAULT_TURBO_UPLOAD_URL,
  arioProcessId: DEFAULT_ARIO_PROCESS_ID,
  useLocalNode: false,
}

// Default configuration values - automatically choose based on environment
export const defaultConfig: AppConfig = isLocalDevelopment()
  ? localConfig
  : productionConfig

// App state interface
interface AppState {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Sidebar
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void

  // Wallet connection state
  walletConnected: boolean
  walletAddress: string | null
  setWalletConnected: (connected: boolean) => void
  setWalletAddress: (address: string | null) => void

  // Configuration
  config: AppConfig
  setConfig: (config: Partial<AppConfig>) => void
  resetConfig: () => void
}

// IDB storage implementation
const idbStorage = createJSONStorage(() => ({
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await openDB('ar-io-explorer-store', 1, {
        upgrade(db) {
          db.createObjectStore('keyval')
        },
      })
      const value = await db.get('keyval', name)
      return value || null
    } catch (error) {
      console.error('Error getting item from IDB:', error)
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const db = await openDB('ar-io-explorer-store', 1, {
        upgrade(db) {
          db.createObjectStore('keyval')
        },
      })
      await db.put('keyval', value, name)
    } catch (error) {
      console.error('Error setting item in IDB:', error)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await openDB('ar-io-explorer-store', 1, {
        upgrade(db) {
          db.createObjectStore('keyval')
        },
      })
      await db.delete('keyval', name)
    } catch (error) {
      console.error('Error removing item from IDB:', error)
    }
  },
}))

// Create the store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme state
      theme: 'system',
      setTheme: (theme: Theme) => set({ theme }),

      // Search state
      searchQuery: '',
      setSearchQuery: (searchQuery: string) => set({ searchQuery }),

      // Sidebar state
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed: boolean) =>
        set({ sidebarCollapsed }),

      // Wallet state
      walletConnected: false,
      walletAddress: null,
      setWalletConnected: (walletConnected: boolean) =>
        set({ walletConnected }),
      setWalletAddress: (walletAddress: string | null) =>
        set({ walletAddress }),

      // Configuration state
      config: defaultConfig,
      setConfig: (newConfig: Partial<AppConfig>) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      resetConfig: () => set({ config: defaultConfig }),
    }),
    {
      name: 'ar-io-explorer-store',
      storage: idbStorage,
      // Only persist certain fields
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        walletAddress: state.walletAddress,
        walletConnected: state.walletConnected,
        config: state.config,
      }),
    },
  ),
)

// Theme utilities
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return 'light'
}

export const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

// Utility function to check if local AR-IO node is available
export const checkLocalNodeAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:4000/ar-io/info', {
      method: 'GET',
      timeout: 5000, // 5 second timeout
    } as RequestInit)
    return response.ok
  } catch (error) {
    console.warn('Local AR-IO node not available:', error)
    return false
  }
}

// Get effective configuration with fallback logic
export const getEffectiveConfig = async (
  config: AppConfig,
): Promise<AppConfig> => {
  if (config.useLocalNode) {
    const isLocalAvailable = await checkLocalNodeAvailability()
    if (!isLocalAvailable) {
      console.warn(
        'Local AR-IO node not available, falling back to production config',
      )
      return {
        ...config,
        gatewayUrl: productionConfig.gatewayUrl,
        databaseUrl: productionConfig.databaseUrl,
        cuUrl: productionConfig.cuUrl,
        useLocalNode: false,
      }
    }
  }
  return config
}
