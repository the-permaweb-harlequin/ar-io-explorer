import { useEffect, useMemo, useState } from 'react'

import { ANTVersions, ANT_REGISTRY_ID, AOProcess } from '@ar.io/sdk'
import { connect } from '@permaweb/aoconnect'
import { useQuery } from '@tanstack/react-query'
import { pLimit } from 'plimit-lit'

import { Tag, useGetTransactionsByIdsQuery } from '@/generated/graphql'
import { ANTStatistics, antStatisticsPersistence } from '@/lib/ant-statistics'
import { graphqlClient } from '@/lib/graphql-client'
import { useAppStore } from '@/store/app-store'

import { usePersistentDatabase } from './usePersistentDatabase'
import { useRegisteredANTs } from './useRegisteredANTs'

export function useANTVersions() {
  const cuUrl = useAppStore((s) => s.config.cuUrl)
  return useQuery({
    queryKey: ['ant-versions', cuUrl],
    queryFn: async () => {
      const antVersions = ANTVersions.init({
        process: new AOProcess({
          processId: ANT_REGISTRY_ID,
          ao: connect({ CU_URL: cuUrl, MODE: 'legacy' }),
        }),
      })
      const versions = await antVersions.getANTVersions()
      return versions
    },
    staleTime: 1000 * 60 * 60 * 24,
    refetchInterval: 1000 * 60 * 60 * 24,
    enabled: !!cuUrl,
    refetchOnWindowFocus: false,
  })
}
export type ANTProcessMetadata = {
  owner: string
  moduleId: string | undefined
  tags: Tag[]
}
export function useANTProcessMetadata(ants: string[]) {
  return useQuery({
    queryKey: ['ant-process-metadata', ants],
    queryFn: async () => {
      // Create a limit function for 10 concurrent requests
      const limit = pLimit(3)

      // Split ants into batches of 100
      const batchSize = 99
      const batches: string[][] = []
      for (let i = 0; i < ants.length; i += batchSize) {
        batches.push(ants.slice(i, i + batchSize))
      }

      // Create concurrent requests for each batch
      const batchPromises = batches.map((batch) =>
        limit(async () => {
          const result: any = await useGetTransactionsByIdsQuery.fetcher(
            graphqlClient,
            {
              ids: batch,
              first: 100,
              tags: [{ name: 'Data-Protocol', values: ['ao'] }],
            },
          )()

          return result.transactions.edges.map((edge: any) => {
            const { node } = edge
            const { owner, tags } = node
            const moduleId = tags.find(
              (tag: any) => tag.name === 'Module',
            )?.value
            return { owner, moduleId, tags }
          })
        }),
      )

      // Wait for all batches to complete and flatten results
      const batchResults = await Promise.all(batchPromises)
      return batchResults.flat()
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!ants.length,
    refetchOnWindowFocus: false,
  })
}

// ANTStatistics type is now imported from the persistence module

export function useANTStatistics(): ANTStatistics {
  const registeredANTs = useRegisteredANTs()
  const { data: antVersions } = useANTVersions()
  const { data: antProcessMetadata } = useANTProcessMetadata(registeredANTs)

  // Get database initialization status
  const {
    isInitialized: isDatabaseInitialized,
    isInitializing: isDatabaseInitializing,
  } = usePersistentDatabase()

  // State for cached statistics
  const [cachedStats, setCachedStats] = useState<ANTStatistics | null>(null)
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(true)
  const [hasFreshCache, setHasFreshCache] = useState(false)

  // Load cached statistics when database is ready
  useEffect(() => {
    const loadCachedStats = async () => {
      if (!isDatabaseInitialized) {
        console.log(
          '⏳ Waiting for database to initialize before loading cached ANT statistics...',
        )
        return
      }

      try {
        setIsLoadingFromCache(true)
        console.log('📥 Loading cached ANT statistics from database...')

        // Try to load from parquet first (for offline capability)
        await antStatisticsPersistence.loadFromParquet()

        // Check if we have fresh cached data
        const isFresh = await antStatisticsPersistence.hasFreshStatistics()
        setHasFreshCache(isFresh)

        if (isFresh) {
          // Use cached data if it's fresh (less than 1 hour old)
          const cached = await antStatisticsPersistence.getLatestStatistics()
          if (cached) {
            setCachedStats(cached)
            console.log('📊 Using cached ANT statistics:', {
              totalAnts: cached.totalAnts,
              latestVersion: cached.latestVersion,
              versionCount: Object.keys(cached.antVersionCounts).length,
            })
          }
        } else {
          console.log(
            '📊 No fresh cached ANT statistics found, will calculate fresh data',
          )
        }
      } catch (error) {
        console.warn('⚠️ Failed to load cached ANT statistics:', error)
      } finally {
        setIsLoadingFromCache(false)
      }
    }

    loadCachedStats()
  }, [isDatabaseInitialized]) // Re-run when database becomes available

  // Calculate fresh statistics
  const totalAnts = registeredANTs.length
  const latestVersion = Object.values(antVersions ?? {}).at(-1)?.moduleId || ''
  const antVersionCounts: Record<string, number> = Object.values(
    antVersions ?? {},
  ).reduce((acc: Record<string, number>, version) => {
    acc[version.moduleId] = 0
    return acc
  }, {})
  antVersionCounts['unknown_version'] = 0

  const freshStats = useMemo(() => {
    if (!antProcessMetadata || !antVersions) {
      return {
        latestVersion,
        totalAnts,
        antVersionCounts,
      }
    }

    const statistics = antProcessMetadata.reduce<ANTStatistics>(
      (acc: ANTStatistics, antProcessMeta: ANTProcessMetadata) => {
        if (antProcessMeta.moduleId) {
          // Check if this moduleId exists in our known versions
          if (acc.antVersionCounts[antProcessMeta.moduleId] !== undefined) {
            acc.antVersionCounts[antProcessMeta.moduleId]++
          } else {
            // Unknown module ID, count as unknown_version
            acc.antVersionCounts['unknown_version']++
          }
        } else {
          // No module ID at all, count as unknown_version
          acc.antVersionCounts['unknown_version']++
        }
        return acc
      },
      {
        latestVersion,
        totalAnts,
        antVersionCounts,
      },
    )
    return statistics
  }, [
    registeredANTs,
    antProcessMetadata,
    antVersions,
    latestVersion,
    totalAnts,
  ])

  // Save fresh statistics to persistent storage
  useEffect(() => {
    const saveStats = async () => {
      if (
        !freshStats ||
        !antProcessMetadata ||
        !antVersions ||
        !isDatabaseInitialized
      ) {
        console.log('⏳ Skipping save - missing data or database not ready:', {
          hasFreshStats: !!freshStats,
          hasMetadata: !!antProcessMetadata,
          hasVersions: !!antVersions,
          isDatabaseInitialized,
        })
        return
      }

      try {
        // Only save if we have complete data and it's different from cached
        const isDifferent =
          !cachedStats ||
          cachedStats.totalAnts !== freshStats.totalAnts ||
          cachedStats.latestVersion !== freshStats.latestVersion ||
          JSON.stringify(cachedStats.antVersionCounts) !==
            JSON.stringify(freshStats.antVersionCounts)

        if (isDifferent) {
          console.log('💾 Saving fresh ANT statistics:', {
            totalAnts: freshStats.totalAnts,
            latestVersion: freshStats.latestVersion,
            versionCount: Object.keys(freshStats.antVersionCounts).length,
          })
          await antStatisticsPersistence.saveStatistics(freshStats)
          setCachedStats(freshStats)
          console.log(
            '✅ Successfully saved fresh ANT statistics to persistent storage',
          )
        } else {
          console.log('📊 ANT statistics unchanged, skipping save')
        }
      } catch (error) {
        console.error('❌ Failed to save ANT statistics:', error)
      }
    }

    // Only save if we have fresh data and either no cache or cache is stale
    if (freshStats && (!hasFreshCache || !cachedStats)) {
      saveStats()
    }
  }, [
    freshStats,
    antProcessMetadata,
    antVersions,
    cachedStats,
    hasFreshCache,
    isDatabaseInitialized,
  ])

  // Return cached stats if available and fresh, otherwise return fresh stats
  if (isDatabaseInitializing || isLoadingFromCache) {
    // Return default stats while database is initializing or loading from cache
    return {
      latestVersion,
      totalAnts,
      antVersionCounts,
    }
  }

  // Use cached stats if they're fresh and available, otherwise use fresh stats
  return hasFreshCache && cachedStats ? cachedStats : freshStats
}
