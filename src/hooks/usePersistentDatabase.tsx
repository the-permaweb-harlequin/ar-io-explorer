import { useEffect, useState } from 'react'

import { persistentDataManager } from '@/lib/duckdb/persistent-data-manager'

/**
 * Hook to manage the persistent database initialization
 */
export function usePersistentDatabase() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initializeDatabase = async () => {
      if (isInitialized || isInitializing) return

      try {
        setIsInitializing(true)
        setError(null)
        
        await persistentDataManager.initialize()
        
        setIsInitialized(true)
        console.log('✅ Persistent database initialized')
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown database initialization error')
        setError(error)
        console.error('❌ Failed to initialize persistent database:', error)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeDatabase()
  }, [isInitialized, isInitializing])

  return {
    isInitialized,
    isInitializing,
    error,
  }
}
