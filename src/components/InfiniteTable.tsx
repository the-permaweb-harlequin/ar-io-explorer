import { useEffect, useMemo } from 'react'

import { type UseInfiniteQueryResult } from '@tanstack/react-query'
import {
  type ColumnDef,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InfiniteTableProps<TData> {
  // The infinite query result from TanStack Query
  query: UseInfiniteQueryResult<any, Error>
  // Function to extract data array from each page
  getDataFromPage: (page: any) => TData[]
  // Table column definitions
  columns: ColumnDef<TData>[]
  // Optional className for styling
  className?: string
  // Messages for different states
  emptyMessage?: string
  loadingMessage?: string
  errorMessage?: string
  // Table configuration
  enableSorting?: boolean
  enableRowSelection?: boolean
  initialSorting?: SortingState
  // Row selection state (if enabled)
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
}

export function InfiniteTable<TData>({
  query,
  getDataFromPage,
  columns,
  className,
  emptyMessage = 'No data found',
  loadingMessage = 'Loading...',
  errorMessage = 'Failed to load data',
  enableSorting = true,
  enableRowSelection = false,
  initialSorting = [],
  rowSelection = {},
  onRowSelectionChange,
}: InfiniteTableProps<TData>) {
  // Extract all data from all pages
  const data = useMemo(() => {
    if (!query.data?.pages) return []
    return query.data.pages.flatMap(getDataFromPage)
  }, [query.data?.pages, getDataFromPage])

  // Table configuration
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    enableSorting,
    enableRowSelection,
    state: {
      sorting: initialSorting,
      ...(enableRowSelection && { rowSelection: rowSelection || {} }),
    },
    onRowSelectionChange: enableRowSelection ? onRowSelectionChange : undefined,
    initialState: {
      sorting: initialSorting,
    },
  })

  // Auto-load more data when scrolling near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage()
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [query])

  // Loading state for initial load
  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-muted-foreground">{loadingMessage}</span>
        </div>
      </div>
    )
  }

  // Error state
  if (query.isError) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="font-medium text-destructive">{errorMessage}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-muted/50 border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center space-x-2',
                            header.column.getCanSort() &&
                              'cursor-pointer select-none hover:text-foreground',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </span>
                          {header.column.getCanSort() && (
                            <div className="flex flex-col">
                              <ChevronUp
                                className={cn(
                                  'h-3 w-3',
                                  header.column.getIsSorted() === 'asc'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground/50',
                                )}
                              />
                              <ChevronDown
                                className={cn(
                                  '-mt-1 h-3 w-3',
                                  header.column.getIsSorted() === 'desc'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground/50',
                                )}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-muted/50 border-b transition-colors',
                    enableRowSelection && row.getIsSelected() && 'bg-muted',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading more indicator */}
      {query.isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading more...
            </span>
          </div>
        </div>
      )}

      {/* Load more button (fallback if auto-scroll doesn't work) */}
      {query.hasNextPage && !query.isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            Load More
          </Button>
        </div>
      )}

      {/* End of data indicator */}
      {!query.hasNextPage && data.length > 0 && (
        <div className="flex justify-center py-4">
          <p className="text-sm text-muted-foreground">No more data to load</p>
        </div>
      )}

      {/* Row count info */}
      {data.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {data.length} of{' '}
            {query.data?.pages?.[0]?.transactions?.count
              ? query.data.pages[0].transactions.count.toLocaleString()
              : 'many'}{' '}
            items
          </div>
          {enableRowSelection && (
            <div>
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected
            </div>
          )}
        </div>
      )}
    </div>
  )
}
