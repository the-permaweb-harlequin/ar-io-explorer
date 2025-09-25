import { useQuery } from '@tanstack/react-query'

import { duckdbQueryKeys, getDuckDBBundle } from '../bundle-manager'

/**
 * React Query hook to get the DuckDB WASM bundle
 * This leverages React Query's caching and deduplication
 */
export const useDuckDBBundle = () => {
  return useQuery({
    queryKey: duckdbQueryKeys.bundle(),
    queryFn: getDuckDBBundle,
    staleTime: Infinity, // Bundle never goes stale
    gcTime: Infinity, // Keep in cache forever
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook to preload the DuckDB bundle
 * Useful for warming up the bundle before it's needed
 */
export const usePreloadDuckDBBundle = () => {
  const { data: bundle, isLoading, error } = useDuckDBBundle()

  return {
    bundle,
    isPreloaded: !!bundle && !isLoading,
    isLoading,
    error,
  }
}
