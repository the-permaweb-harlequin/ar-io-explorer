import { useMemo, useState } from 'react'

import { type ColumnDef } from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useArFSDrives } from '@/hooks/useArFSDrives'
import { formatAddressForDisplay } from '@/lib/address-utils'
import type { ArFSDrive } from '@/lib/arfs-client'
import { cn } from '@/lib/utils'

interface ARFSExplorerProps {
  className?: string
}

export function ARFSExplorer({ className }: ARFSExplorerProps) {
  const { drives, loading, error, refetch } = useArFSDrives()
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

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
  const columns = useMemo<Array<ColumnDef<ArFSDrive>>>(
    () => [
      {
        accessorKey: 'driveId',
        header: 'Drive ID',
        cell: ({ row }) => {
          const drive = row.original
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(drive.driveId)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  copyToClipboard(drive.driveId, `drive-${drive.driveId}`)
                }
                title={
                  copiedItems.has(`drive-${drive.driveId}`)
                    ? 'Copied!'
                    : 'Copy Drive ID'
                }
              >
                {copiedItems.has(`drive-${drive.driveId}`) ? (
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
        accessorKey: 'id',
        header: 'Transaction ID',
        cell: ({ row }) => {
          const drive = row.original
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(drive.id)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => copyToClipboard(drive.id, `tx-${drive.id}`)}
                title={
                  copiedItems.has(`tx-${drive.id}`)
                    ? 'Copied!'
                    : 'Copy Transaction ID'
                }
              >
                {copiedItems.has(`tx-${drive.id}`) ? (
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
                  window.open(`https://arscan.io/tx/${drive.id}`, '_blank')
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
        accessorKey: 'owner',
        header: 'Owner',
        cell: ({ row }) => {
          const drive = row.original
          return (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">
                {formatAddressForDisplay(drive.owner)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  copyToClipboard(drive.owner, `owner-${drive.owner}`)
                }
                title={
                  copiedItems.has(`owner-${drive.owner}`)
                    ? 'Copied!'
                    : 'Copy Owner Address'
                }
              >
                {copiedItems.has(`owner-${drive.owner}`) ? (
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
                    `https://arscan.io/address/${drive.owner}`,
                    '_blank',
                  )
                }
                title="View Owner on ArScan"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )
        },
      },
      {
        accessorKey: 'privacy',
        header: 'Privacy',
        cell: ({ row }) => {
          const drive = row.original
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                drive.privacy === 'public'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
              )}
            >
              {drive.privacy}
            </span>
          )
        },
      },
      {
        accessorKey: 'arfsVersion',
        header: 'ArFS Version',
        cell: ({ row }) => {
          const drive = row.original
          return <span className="font-mono text-sm">{drive.arfsVersion}</span>
        },
      },
    ],
    [copiedItems],
  )

  // Table configuration
  const table = useReactTable({
    data: drives,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
  })

  // Loading state
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-muted-foreground">Loading ArFS drives...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Failed to load ArFS drives</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ArFS Explorer</h1>
          <p className="text-muted-foreground">
            Browse Arweave File System (ArFS) drives
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            <span>Total: {drives.length.toLocaleString()} drives</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-muted/50 border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/50 border-b transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No ArFS drives found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
