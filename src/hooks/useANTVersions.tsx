import { useMemo } from 'react'

import { ANTVersions, ANT_REGISTRY_ID, AOProcess } from '@ar.io/sdk'
import { connect } from '@permaweb/aoconnect'
import { useQuery } from '@tanstack/react-query'
import { pLimit } from 'plimit-lit'

import { Tag, useGetTransactionsByIdsQuery } from '@/generated/graphql'
import { graphqlClient } from '@/lib/graphql-client'
import { useAppStore } from '@/store/app-store'

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

export type ANTStatistics = {
  latestVersion: string // module id
  totalAnts: number
  antVersionCounts: Record<string, number> // module id -> ant count for that version
}

export function useANTStatistics(): ANTStatistics {
  const registeredANTs = useRegisteredANTs()
  const { data: antVersions } = useANTVersions()
  const { data: antProcessMetadata } = useANTProcessMetadata(registeredANTs)

  const totalAnts = registeredANTs.length
  const latestVersion = Object.values(antVersions ?? {}).at(-1)?.moduleId || ''
  const antVersionCounts: Record<string, number> = Object.values(
    antVersions ?? {},
  ).reduce((acc: Record<string, number>, version) => {
    acc[version.moduleId] = 0
    return acc
  }, {})
  antVersionCounts['unknown_version'] = 0

  const stats = useMemo(() => {
    // if (!antProcessMetadata || !antVersions)
    //   return {
    //     latestVersion,
    //     totalAnts,
    //     antVersionCounts,
    //   }

    const statistics = antProcessMetadata?.reduce<ANTStatistics>(
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
        return acc as any as ANTStatistics
      },
      {
        latestVersion,
        totalAnts,
        antVersionCounts,
      },
    )
    return (
      statistics ?? {
        latestVersion,
        totalAnts,
        antVersionCounts,
      }
    )
  }, [registeredANTs, antProcessMetadata, antVersions])
  return stats
}
