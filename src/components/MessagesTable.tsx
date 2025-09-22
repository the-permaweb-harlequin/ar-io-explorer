import { useMemo, useState } from 'react'

import { type ColumnDef } from '@tanstack/react-table'
import { Clock, Copy, ExternalLink, Settings } from 'lucide-react'

import { FilterModal, type FilterTag } from '@/components/FilterModal'
import { FilterTags } from '@/components/FilterTags'
import { InfiniteTable } from '@/components/InfiniteTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatAddressForDisplay } from '@/lib/address-utils'
import {
  parseAoMessage,
  useInfiniteAllMessages,
  useInfiniteIncomingMessages,
  useInfiniteOutgoingMessages,
  useInfiniteTokenTransfers,
} from '@/lib/ao-queries'
import type { AoMessage } from '@/lib/ao-queries'

type MessageQueryType = 'all' | 'incoming' | 'outgoing' | 'tokens'

interface MessagesTableProps {
  limit?: number
  ascending?: boolean
  className?: string
  // Optional entity ID for incoming/outgoing/token queries
  entityId?: string
  // Default query type
  defaultQueryType?: MessageQueryType
}

export function MessagesTable({
  limit = 50,
  ascending = false,
  className,
  entityId,
  defaultQueryType = 'all',
}: MessagesTableProps) {
  const [queryType, setQueryType] = useState<MessageQueryType>(defaultQueryType)
  const [currentEntityId, setCurrentEntityId] = useState(entityId || '')
  const [actionFilter, setActionFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [advancedFilters, setAdvancedFilters] = useState<Array<FilterTag>>([])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Build extra filters for all messages query
  const extraFilters = useMemo(() => {
    const filters: Record<string, string> = {}
    if (actionFilter) filters['Action'] = actionFilter
    if (typeFilter) filters['Type'] = typeFilter

    // Add advanced tag filters
    advancedFilters.forEach((filter) => {
      if (filter.type === 'tag' && filter.name && filter.value) {
        filters[filter.name] = filter.value
      }
    })

    return Object.keys(filters).length > 0 ? filters : undefined
  }, [actionFilter, typeFilter, advancedFilters])

  // Build recipients and owners from advanced filters
  const recipients = useMemo(() => {
    return advancedFilters
      .filter(
        (filter: FilterTag) => filter.type === 'recipient' && filter.address,
      )
      .map((filter: FilterTag) => filter.address!)
  }, [advancedFilters])

  const owners = useMemo(() => {
    return advancedFilters
      .filter((filter: FilterTag) => filter.type === 'owner' && filter.address)
      .map((filter: FilterTag) => filter.address!)
  }, [advancedFilters])

  // Query hooks
  const allMessagesQuery = useInfiniteAllMessages(
    limit,
    ascending,
    extraFilters,
    recipients,
    owners,
  )
  const incomingQuery = useInfiniteIncomingMessages(
    currentEntityId,
    limit,
    ascending,
  )
  const outgoingQuery = useInfiniteOutgoingMessages(
    currentEntityId,
    limit,
    ascending,
    false,
  )
  const tokensQuery = useInfiniteTokenTransfers(
    currentEntityId,
    limit,
    ascending,
  )

  // Get current query based on type
  const getCurrentQuery = () => {
    switch (queryType) {
      case 'all':
        return allMessagesQuery
      case 'incoming':
        return incomingQuery
      case 'outgoing':
        return outgoingQuery
      case 'tokens':
        return tokensQuery
      default:
        return allMessagesQuery
    }
  }

  const currentQuery = getCurrentQuery()

  // Extract data from query pages
  const getDataFromPage = useMemo(
    () => (page: any) => {
      if (!page?.transactions?.edges) return []
      return page.transactions.edges.map((edge: any) => parseAoMessage(edge))
    },
    [],
  )

  // Copy to clipboard helper
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Filter handlers
  const handleApplyFilters = (filters: Array<FilterTag>) => {
    setAdvancedFilters(filters)
  }

  const handleRemoveFilter = (id: string) => {
    setAdvancedFilters(advancedFilters.filter((filter) => filter.id !== id))
  }

  const handleClearAllFilters = () => {
    setAdvancedFilters([])
    setActionFilter('')
    setTypeFilter('')
  }

  // Define table columns - focused on the 5 core fields requested
  const columns = useMemo<Array<ColumnDef<AoMessage>>>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => {
          const message = row.original
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(message.id)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(message.id)}
                title="Copy Message ID"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  window.open(`https://arweave.net/${message.id}`, '_blank')
                }
                title="View on Arweave"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )
        },
      },
      {
        accessorKey: 'tags.Action',
        header: 'Action',
        cell: ({ row }) => {
          const action = row.original.tags['Action']
          return action ? (
            <span className="bg-secondary/50 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-secondary-foreground">
              {action}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )
        },
      },
      {
        accessorKey: 'from',
        header: 'From',
        cell: ({ row }) => {
          const message = row.original
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(message.from)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(message.from)}
                title="Copy From Address"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )
        },
      },
      {
        accessorKey: 'to',
        header: 'To',
        cell: ({ row }) => {
          const message = row.original
          if (!message.to)
            return <span className="text-muted-foreground">-</span>

          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(message.to)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(message.to)}
                title="Copy To Address"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )
        },
      },
      {
        accessorKey: 'block.timestamp',
        header: 'Date',
        cell: ({ row }) => {
          const timestamp = row.original.block?.timestamp
          if (!timestamp)
            return <span className="text-muted-foreground">-</span>

          const date = new Date(timestamp * 1000)
          return (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm">{date.toLocaleDateString()}</span>
                <span className="text-xs text-muted-foreground">
                  {date.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )
        },
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AO Messages</h2>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            {currentQuery.data?.pages[0]?.transactions?.count && (
              <span>
                Total:{' '}
                {currentQuery.data.pages[0].transactions.count.toLocaleString()}{' '}
                messages
              </span>
            )}
          </div>
        </div>

        <div className="bg-muted/50 flex flex-wrap items-end gap-4 rounded-lg pb-4">
          {/* Advanced Filters Button */}
          <Button
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Filters</span>
            {advancedFilters.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {advancedFilters.length}
              </span>
            )}
          </Button>
        </div>
      </div>{' '}
      {/* Filter Tags */}
      <FilterTags
        filters={advancedFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
        actionFilter={actionFilter}
        typeFilter={typeFilter}
        onRemoveActionFilter={() => setActionFilter('')}
        onRemoveTypeFilter={() => setTypeFilter('')}
      />
      {/* Table */}
      <InfiniteTable
        query={currentQuery as any}
        getDataFromPage={getDataFromPage}
        columns={columns}
        className={className}
        emptyMessage="No messages found"
        loadingMessage="Loading messages..."
        errorMessage="Failed to load messages"
        enableSorting={true}
        initialSorting={[{ id: 'block.timestamp', desc: !ascending }]}
      />
      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        existingFilters={advancedFilters}
      />
    </div>
  )
}
