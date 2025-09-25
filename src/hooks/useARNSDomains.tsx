import {
  AOProcess,
  ARIO,
  ARIO_MAINNET_PROCESS_ID,
  AoArNSNameData,
} from '@ar.io/sdk'
import { connect } from '@permaweb/aoconnect'
import { useQuery } from '@tanstack/react-query'

export function useARNSDomains() {
  return useQuery({
    queryKey: ['arns-domains'],
    queryFn: async () => {
      const ario = ARIO.init({
        process: new AOProcess({
          processId: ARIO_MAINNET_PROCESS_ID,
          ao: connect({ CU_URL: 'https://cu.ardrive.io', MODE: 'legacy' }),
        }),
      })
      let cursor: string | undefined = undefined
      let hasNextPage = true
      const domains: Record<string, AoArNSNameData> = {}
      while (hasNextPage) {
        const result = await ario.getArNSRecords({
          cursor,
          limit: 1000,
        })
        for (const item of result.items) {
          const { name, ...record } = item
          domains[name] = record
        }
        cursor = result.nextCursor ?? undefined
        hasNextPage = result.hasMore
      }

      return domains
    },
  })
}
