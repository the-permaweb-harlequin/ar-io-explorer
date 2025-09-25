import { useMemo } from 'react'

import { useARNSDomains } from './useARNSDomains'

export function useRegisteredANTs() {
  const { data: arnsDomains, isLoading: isLoadingARNSDomains } =
    useARNSDomains()
  return useMemo(() => {
    return Array.from(
      new Set(
        Object.values(arnsDomains ?? {}).map((record) => record.processId),
      ),
    )
  }, [arnsDomains, isLoadingARNSDomains])
}
