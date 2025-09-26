import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'

import { graphqlClient } from '@/lib/graphql-client'

// Create IndexedDB persister
function createIDBPersister(idbValidKey = 'ar-io-explorer-query-cache') {
  return {
    persistClient: async (client: any) => {
      await set(idbValidKey, client)
    },
    restoreClient: async () => {
      return await get(idbValidKey)
    },
    removeClient: async () => {
      await del(idbValidKey)
    },
  }
}

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes (default)
        retry: 2,
        gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (keep data in cache for a week)
      },
    },
  })

  // Set up persistence with IndexedDB
  const persister = createIDBPersister()

  // Use setTimeout to avoid blocking the initial render
  setTimeout(() => {
    try {
      persistQueryClient({
        queryClient,
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        buster: '', // Can be used to invalidate all cached data when needed
      })
    } catch (error) {
      console.warn('Failed to set up query persistence:', error)
    }
  }, 0)

  return {
    queryClient,
    graphqlClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
