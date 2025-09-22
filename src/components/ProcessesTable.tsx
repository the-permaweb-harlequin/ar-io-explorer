import { useMemo, useState } from 'react'

import { type ColumnDef } from '@tanstack/react-table'
import { Check, Clock, Copy, ExternalLink, Settings } from 'lucide-react'

import { FilterModal, type FilterTag } from '@/components/FilterModal'
import { FilterTags } from '@/components/FilterTags'
import { InfiniteTable } from '@/components/InfiniteTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  // Filter state
  const [nameFilter, setNameFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState(moduleId || '')
  const [advancedFilters, setAdvancedFilters] = useState<Array<FilterTag>>([])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Build extra filters for processes query
  const extraFilters = useMemo(() => {
    const filters: Record<string, string> = {}
    if (nameFilter) filters['Name'] = nameFilter
    if (moduleFilter) filters['Module'] = moduleFilter

    // Add advanced tag filters
    advancedFilters.forEach((filter) => {
      if (filter.type === 'tag' && filter.name && filter.value) {
        filters[filter.name] = filter.value
      }
    })

    return Object.keys(filters).length > 0 ? filters : undefined
  }, [nameFilter, moduleFilter, advancedFilters])

  // Build owners from advanced filters
  const owners = useMemo(() => {
    return advancedFilters
      .filter((filter: FilterTag) => filter.type === 'owner' && filter.address)
      .map((filter: FilterTag) => filter.address!)
  }, [advancedFilters])

  // Use the infinite processes query with filters
  const processesQuery = useInfiniteProcesses(
    limit,
    ascending,
    undefined, // Don't pass moduleId directly, use extraFilters instead
    extraFilters,
    owners,
  )

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

  // Filter handlers
  const handleApplyFilters = (filters: Array<FilterTag>) => {
    setAdvancedFilters(filters)
  }

  const handleRemoveFilter = (id: string) => {
    setAdvancedFilters(advancedFilters.filter((filter) => filter.id !== id))
  }

  const handleClearAllFilters = () => {
    setAdvancedFilters([])
    setNameFilter('')
    setModuleFilter('')
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
            return <span className="italic text-muted-foreground">Unnamed</span>
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
      {/* Header with inline filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">AO Processes</h2>

          {/* Inline Filters */}
          <div className="flex w-fit items-center gap-3">
            {/* Name Filter */}
            <div className="flex w-fit items-center gap-2">
              <Label htmlFor="nameFilter" className="whitespace-nowrap text-sm">
                Name:
              </Label>
              <Input
                id="nameFilter"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Process name"
                className="h-8 w-fit"
              />
            </div>

            {/* Module Filter */}
            <div className="flex w-fit items-center gap-2">
              <Label
                htmlFor="moduleFilter"
                className="whitespace-nowrap text-sm"
              >
                Module:
              </Label>
              <Input
                id="moduleFilter"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                placeholder="Module ID"
                className="h-8 w-fit font-mono text-sm"
              />
            </div>

            {/* Advanced Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterModalOpen(true)}
              className="flex h-8 items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Advanced</span>
              {advancedFilters.length > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {advancedFilters.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
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

      {/* Filter Tags */}
      <FilterTags
        filters={advancedFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
        actionFilter={nameFilter}
        typeFilter={moduleFilter}
        onRemoveActionFilter={() => setNameFilter('')}
        onRemoveTypeFilter={() => setModuleFilter('')}
      />

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
