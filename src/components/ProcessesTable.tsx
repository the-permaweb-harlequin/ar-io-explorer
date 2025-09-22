import { useMemo, useState } from 'react'

import { type ColumnDef } from '@tanstack/react-table'
import { Check, Clock, Copy, ExternalLink } from 'lucide-react'

import { InfiniteTable } from '@/components/InfiniteTable'
import { Button } from '@/components/ui/button'
import { formatAddressForDisplay } from '@/lib/address-utils'
import { parseAoMessage, useInfiniteProcesses } from '@/lib/ao-queries'
import type { AoMessage } from '@/lib/ao-queries'

interface ProcessesTableProps {
  limit?: number
  ascending?: boolean
  moduleId?: string
  className?: string
}

export function ProcessesTable({
  limit = 50,
  ascending = false,
  moduleId,
  className,
}: ProcessesTableProps) {
  // Use the infinite processes query
  const processesQuery = useInfiniteProcesses(limit, ascending, moduleId)

  // State for copy animation
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

  // Extract data from query pages
  const getDataFromPage = useMemo(
    () => (page: any) => {
      if (!page?.transactions?.edges) return []
      return page.transactions.edges.map((edge: any) => parseAoMessage(edge))
    },
    [],
  )

  // Copy to clipboard helper with animation
  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItems((prev) => new Set(prev).add(itemId))
      // Remove the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems((prev) => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Define table columns
  const columns = useMemo<Array<ColumnDef<AoMessage>>>(
    () => [
      {
        accessorKey: 'id',
        header: 'Process ID',
        cell: ({ row }) => {
          const process = row.original
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(process.id)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  copyToClipboard(process.id, `process-${process.id}`)
                }
                title={
                  copiedItems.has(`process-${process.id}`)
                    ? 'Copied!'
                    : 'Copy Process ID'
                }
              >
                {copiedItems.has(`process-${process.id}`) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  window.open(`https://arscan.io/tx/${process.id}`, '_blank')
                }
                title="View on ArScan"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )
        },
      },
      {
        accessorKey: 'from',
        header: 'Owner',
        cell: ({ row }) => {
          const process = row.original
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(process.from)}
              </span>
              <span className="bg-accent/50 rounded px-1 text-xs">
                {process.fromParsed.type}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  copyToClipboard(process.from, `owner-${process.id}`)
                }
                title={
                  copiedItems.has(`owner-${process.id}`)
                    ? 'Copied!'
                    : 'Copy Owner Address'
                }
              >
                {copiedItems.has(`owner-${process.id}`) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )
        },
      },
      {
        accessorKey: 'tags.Module',
        header: 'Module',
        cell: ({ row }) => {
          const processModuleId = row.original.tags['Module']
          if (!processModuleId)
            return <span className="text-muted-foreground">-</span>

          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(processModuleId)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  copyToClipboard(processModuleId, `module-${row.original.id}`)
                }
                title={
                  copiedItems.has(`module-${row.original.id}`)
                    ? 'Copied!'
                    : 'Copy Module ID'
                }
              >
                {copiedItems.has(`module-${row.original.id}`) ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  window.open(
                    `https://arscan.io/tx/${processModuleId}`,
                    '_blank',
                  )
                }
                title="View Module on ArScan"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )
        },
      },
      {
        accessorKey: 'tags.Name',
        header: 'Name',
        cell: ({ row }) => {
          const name = row.original.tags['Name']
          if (!name) {
            return <span className="text-muted-foreground italic">Unnamed</span>
          }

          const displayName =
            name.length > 16 ? `${name.slice(0, 16)}...` : name
          return (
            <span className="font-medium" title={name}>
              {displayName}
            </span>
          )
        },
      },
      {
        id: 'timestamp',
        accessorFn: (row) => row.block?.timestamp,
        header: 'Created',
        cell: ({ row }) => {
          const timestamp = row.original.block?.timestamp
          if (!timestamp)
            return <span className="text-muted-foreground">-</span>

          const date = new Date(timestamp * 1000)
          return (
            <div className="flex items-center space-x-1">
              <Clock className="text-muted-foreground h-3 w-3" />
              <div className="flex flex-col">
                <span className="text-sm">{date.toLocaleDateString()}</span>
                <span className="text-muted-foreground text-xs">
                  {date.toLocaleTimeString()}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'data.size',
        header: 'Size',
        cell: ({ row }) => {
          const size = parseInt(row.original.data.size)
          if (isNaN(size))
            return <span className="text-muted-foreground">-</span>

          // Format bytes to human readable
          const formatBytes = (bytes: number) => {
            if (bytes === 0) return '0 B'
            const k = 1024
            const sizes = ['B', 'KB', 'MB', 'GB']
            const i = Math.floor(Math.log(bytes) / Math.log(k))
            return (
              parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
            )
          }

          return <span className="font-mono text-sm">{formatBytes(size)}</span>
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
          <h2 className="text-2xl font-bold">AO Processes</h2>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-muted-foreground text-sm">
            {processesQuery.data?.pages?.[0]?.transactions?.count && (
              <span>
                Total:{' '}
                {processesQuery.data.pages[0].transactions.count.toLocaleString()}{' '}
                processes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <InfiniteTable
        query={processesQuery as any}
        getDataFromPage={getDataFromPage}
        columns={columns}
        className={className}
        emptyMessage="No processes found"
        loadingMessage="Loading processes..."
        errorMessage="Failed to load processes"
        enableSorting={true}
        enableRowSelection={false}
        initialSorting={[{ id: 'timestamp', desc: !ascending }]}
      />
    </div>
  )
}
