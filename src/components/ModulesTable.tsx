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
import { parseAoMessage, useInfiniteModules } from '@/lib/ao-queries'
import type { AoMessage } from '@/lib/ao-queries'

interface ModulesTableProps {
  limit?: number
  ascending?: boolean
  className?: string
}

export function ModulesTable({
  limit = 50,
  ascending = false,
  className,
}: ModulesTableProps) {
  // Filter state
  const [contentTypeFilter, setContentTypeFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [advancedFilters, setAdvancedFilters] = useState<Array<FilterTag>>([])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Use the infinite modules query
  const modulesQuery = useInfiniteModules(limit, ascending)

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

  // Filter data based on local filters
  const filteredGetDataFromPage = useMemo(
    () => (page: any) => {
      const data = getDataFromPage(page)
      return data.filter((module: AoMessage) => {
        // Apply content-type filter
        if (contentTypeFilter) {
          const contentType = module.tags['Content-Type']
          if (
            !contentType ||
            !contentType.toLowerCase().includes(contentTypeFilter.toLowerCase())
          ) {
            return false
          }
        }

        // Apply owner filter
        if (ownerFilter) {
          if (!module.from.toLowerCase().includes(ownerFilter.toLowerCase())) {
            return false
          }
        }

        // Apply advanced filters
        for (const filter of advancedFilters) {
          if (filter.type === 'tag' && filter.name && filter.value) {
            const tagValue = module.tags[filter.name]
            if (
              !tagValue ||
              !tagValue.toLowerCase().includes(filter.value.toLowerCase())
            ) {
              return false
            }
          }
          if (filter.type === 'owner' && filter.address) {
            if (
              !module.from.toLowerCase().includes(filter.address.toLowerCase())
            ) {
              return false
            }
          }
        }

        return true
      })
    },
    [contentTypeFilter, ownerFilter, advancedFilters, getDataFromPage],
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
    setContentTypeFilter('')
    setOwnerFilter('')
  }

  // Define table columns
  const columns = useMemo<Array<ColumnDef<AoMessage>>>(
    () => [
      {
        accessorKey: 'id',
        header: 'Module ID',
        cell: ({ row }) => {
          const module = row.original
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(module.id)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  copyToClipboard(module.id, `module-${module.id}`)
                }
                title={
                  copiedItems.has(`module-${module.id}`)
                    ? 'Copied!'
                    : 'Copy Module ID'
                }
              >
                {copiedItems.has(`module-${module.id}`) ? (
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
                  window.open(`https://arscan.io/tx/${module.id}`, '_blank')
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
          const module = row.original
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(module.from)}
              </span>
              <span className="bg-accent/50 rounded px-1 text-xs">
                {module.fromParsed.type}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  copyToClipboard(module.from, `owner-${module.id}`)
                }
                title={
                  copiedItems.has(`owner-${module.id}`)
                    ? 'Copied!'
                    : 'Copy Owner Address'
                }
              >
                {copiedItems.has(`owner-${module.id}`) ? (
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
        accessorKey: 'tags.Content-Type',
        header: 'Content-Type',
        cell: ({ row }) => {
          const contentType = row.original.tags['Content-Type']
          if (!contentType) {
            return <span className="text-muted-foreground">-</span>
          }

          return (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {contentType}
            </span>
          )
        },
      },
      {
        accessorKey: 'tags.Module-Format',
        header: 'Format',
        cell: ({ row }) => {
          const format = row.original.tags['Module-Format']
          if (!format) {
            return <span className="text-muted-foreground">-</span>
          }

          return (
            <span className="bg-secondary/50 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-secondary-foreground">
              {format}
            </span>
          )
        },
      },
      {
        id: 'encoding',
        header: 'Encoding',
        cell: ({ row }) => {
          const inputEncoding = row.original.tags['Input-Encoding']
          const outputEncoding = row.original.tags['Output-Encoding']

          if (!inputEncoding && !outputEncoding) {
            return <span className="text-muted-foreground">-</span>
          }

          return (
            <div className="flex flex-col gap-1">
              {inputEncoding && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  In: {inputEncoding}
                </span>
              )}
              {outputEncoding && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                  Out: {outputEncoding}
                </span>
              )}
            </div>
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
    [copiedItems],
  )

  return (
    <div className="space-y-4">
      {/* Header with inline filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">AO Modules</h2>

          {/* Inline Filters */}
          <div className="flex w-fit items-center gap-3">
            {/* Content-Type Filter */}
            <div className="flex w-fit items-center gap-2">
              <Label
                htmlFor="contentTypeFilter"
                className="whitespace-nowrap text-sm"
              >
                Content-Type:
              </Label>
              <Input
                id="contentTypeFilter"
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                placeholder="Content type"
                className="h-8 w-fit"
              />
            </div>

            {/* Owner Filter */}
            <div className="flex w-fit items-center gap-2">
              <Label
                htmlFor="ownerFilter"
                className="whitespace-nowrap text-sm"
              >
                Owner:
              </Label>
              <Input
                id="ownerFilter"
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                placeholder="Owner address"
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
            {modulesQuery.data?.pages?.[0]?.transactions?.count && (
              <span>
                Total:{' '}
                {modulesQuery.data.pages[0].transactions.count.toLocaleString()}{' '}
                modules
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
        actionFilter={contentTypeFilter}
        typeFilter={ownerFilter}
        onRemoveActionFilter={() => setContentTypeFilter('')}
        onRemoveTypeFilter={() => setOwnerFilter('')}
      />

      {/* Table */}
      <InfiniteTable
        query={modulesQuery as any}
        getDataFromPage={filteredGetDataFromPage}
        columns={columns}
        className={className}
        emptyMessage="No modules found"
        loadingMessage="Loading modules..."
        errorMessage="Failed to load modules"
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
