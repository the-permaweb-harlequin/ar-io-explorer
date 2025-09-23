import { useCallback, useEffect, useState } from 'react'

export interface AOSProcessState {
  processId: string | null
  isConnected: boolean
  selectedProcessHistory: string | null
  error: string | null
  isLoading: boolean
}

export interface UseAOSProcessReturn extends AOSProcessState {
  connectProcess: (processId: string) => Promise<void>
  disconnectProcess: () => void
  clearHistory: () => void
  refreshHistory: () => Promise<void>
}

export function useAOSProcess(initialProcessId?: string): UseAOSProcessReturn {
  const [state, setState] = useState<AOSProcessState>({
    processId: initialProcessId || null,
    isConnected: false,
    selectedProcessHistory: null,
    error: null,
    isLoading: false,
  })

  // Mock function to simulate fetching process history
  // In a real implementation, this would connect to AOS and fetch actual process data
  const fetchProcessHistory = useCallback(
    async (processId: string): Promise<string> => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock process history data
      const mockHistory = `
AOS Process: ${processId}
Connected at: ${new Date().toISOString()}

> Welcome to AOS Terminal
> Process ID: ${processId}
> Status: Active
> 
> Available commands:
>   help - Show available commands
>   status - Show process status  
>   logs - Show recent logs
>   clear - Clear terminal
>
> Type 'help' for more information
> Ready for input...
    `.trim()

      return mockHistory
    },
    [],
  )

  const connectProcess = useCallback(
    async (processId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const history = await fetchProcessHistory(processId)
        setState((prev) => ({
          ...prev,
          processId,
          isConnected: true,
          selectedProcessHistory: history,
          isLoading: false,
          error: null,
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to connect to process',
        }))
      }
    },
    [fetchProcessHistory],
  )

  const disconnectProcess = useCallback(() => {
    setState((prev) => ({
      ...prev,
      processId: null,
      isConnected: false,
      selectedProcessHistory: null,
      error: null,
      isLoading: false,
    }))
  }, [])

  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedProcessHistory: null,
    }))
  }, [])

  const refreshHistory = useCallback(async () => {
    if (!state.processId) return

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const history = await fetchProcessHistory(state.processId)
      setState((prev) => ({
        ...prev,
        selectedProcessHistory: history,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to refresh history',
      }))
    }
  }, [state.processId, fetchProcessHistory])

  // Auto-connect if initialProcessId is provided
  useEffect(() => {
    if (initialProcessId && !state.isConnected && !state.isLoading) {
      connectProcess(initialProcessId)
    }
  }, [initialProcessId, state.isConnected, state.isLoading, connectProcess])

  return {
    ...state,
    connectProcess,
    disconnectProcess,
    clearHistory,
    refreshHistory,
  }
}
