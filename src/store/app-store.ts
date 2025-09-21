import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { openDB } from 'idb'

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
}

// Default configuration values
export const defaultConfig: AppConfig = {
  gatewayUrl: 'https://arweave.net',
  databaseUrl: 'https://clickhouse.ar-io.dev',
  cuUrl: 'https://cu.ar-io.dev',
  hyperbeamNodeUrl: 'https://hyperbeam.ar-io.dev',
  turboPaymentUrl: 'https://payment.ardrive.io',
  turboUploadUrl: 'https://upload.ardrive.io',
}

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
    (set, get) => ({
      // Theme state
      theme: 'system',
      setTheme: (theme: Theme) => set({ theme }),
      
      // Search state
      searchQuery: '',
      setSearchQuery: (searchQuery: string) => set({ searchQuery }),
      
      // Sidebar state
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed: boolean) => set({ sidebarCollapsed }),
      
      // Wallet state
      walletConnected: false,
      walletAddress: null,
      setWalletConnected: (walletConnected: boolean) => set({ walletConnected }),
      setWalletAddress: (walletAddress: string | null) => set({ walletAddress }),
      
      // Configuration state
      config: defaultConfig,
      setConfig: (newConfig: Partial<AppConfig>) => set((state) => ({
        config: { ...state.config, ...newConfig }
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
    }
  )
)

// Theme utilities
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}
