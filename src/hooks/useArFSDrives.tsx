import { useEffect, useState } from 'react'

import { ArFSClient, type ArFSDrive } from '@/lib/arfs-client'
import { useDuckDB } from '@/lib/duckdb'
import { ParquetClient } from '@/lib/parquet-client'

export const useArFSDrives = () => {
  const [drives, setDrives] = useState<ArFSDrive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Initialize a dedicated DuckDB instance for ARFS explorer
  const {
    db,
    loading: dbLoading,
    error: dbError,
  } = useDuckDB({
    id: 'arfs-explorer',
    name: 'ARFS Explorer Database',
    debug: true,
  })

  const fetchDrives = async () => {
    if (!db) return

    try {
      setLoading(true)
      setError(null)

      const parquetClient = new ParquetClient(db)
      const arfsClient = new ArFSClient(parquetClient)

      // Get ArFS drives using the domain-specific client
      const arfsDrives = await arfsClient.getDrives({
        limit: 100,
        orderBy: 'height',
        orderDirection: 'DESC',
      })

      setDrives(arfsDrives)
    } catch (err) {
      console.error('Failed to fetch ArFS drives:', err)
      setError(
        err instanceof Error ? err : new Error('Failed to fetch ArFS drives'),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (db && !dbLoading && !dbError) {
      fetchDrives()
    }
  }, [db, dbLoading, dbError])

  return {
    drives,
    loading: dbLoading || loading,
    error: dbError || error,
    refetch: fetchDrives,
  }
}
