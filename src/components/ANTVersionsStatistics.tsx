import { useMemo, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Check, Copy, Download, RefreshCw } from 'lucide-react'
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useANTStatistics, useANTVersions } from '@/hooks/useANTVersions'

// Color palette for the bar chart
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
]

interface ANTVersionsStatisticsProps {
  className?: string
}

export function ANTVersionsStatistics({
  className,
}: ANTVersionsStatisticsProps) {
  const statistics = useANTStatistics()
  const { data: antVersions } = useANTVersions()
  const queryClient = useQueryClient()
  const [copiedLatestVersion, setCopiedLatestVersion] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Copy to clipboard helper for latest version
  const copyLatestVersion = async () => {
    if (statistics.latestVersion) {
      try {
        await navigator.clipboard.writeText(statistics.latestVersion)
        setCopiedLatestVersion(true)
        setTimeout(() => setCopiedLatestVersion(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  // Refresh ARNS and ANT versions data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Invalidate ARNS domains and ANT versions queries (NOT GraphQL queries)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['arns-domains'] }),
        queryClient.invalidateQueries({ queryKey: ['ant-versions'] }),
      ])
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Export version distribution data to CSV
  const handleCSVExport = () => {
    if (!chartData.length) return

    // Create CSV headers
    const headers = ['Version', 'Module ID', 'Count', 'Percentage']

    // Create CSV rows
    const rows = chartData.map((item) => [
      item.versionNumber || 'Unknown',
      item.fullModuleId,
      item.count.toString(),
      `${item.percentage}%`,
    ])

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n')

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `ant-version-distribution-${new Date().toISOString().split('T')[0]}.csv`,
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Create a mapping from moduleId to version number
  const moduleIdToVersion = useMemo(() => {
    if (!antVersions) return {}
    const mapping: Record<string, string> = {}
    Object.entries(antVersions).forEach(([versionNumber, versionData]) => {
      mapping[versionData.moduleId] = versionNumber
    })
    return mapping
  }, [antVersions])

  const chartData = useMemo(() => {
    if (!statistics.antVersionCounts) return []

    const totalANTs = Object.values(statistics.antVersionCounts).reduce(
      (sum, count) => sum + count,
      0,
    )

    return Object.entries(statistics.antVersionCounts)
      .filter(([_, count]) => count > 0) // Only show versions with ANTs
      .map(([moduleId, count], index) => {
        const versionNumber = moduleIdToVersion[moduleId]
        const percentage = ((count / totalANTs) * 100).toFixed(1)

        let displayName: string
        if (moduleId === 'unknown_version') {
          displayName = `Unknown (${percentage}%)`
        } else if (versionNumber) {
          displayName = `v${versionNumber} (${percentage}%)`
        } else {
          displayName = `Unknown v (${percentage}%)`
        }

        return {
          moduleId: displayName,
          fullModuleId: moduleId,
          versionNumber,
          count,
          percentage,
          fill: COLORS[index % COLORS.length],
        }
      })
      .sort((a, b) => {
        // Sort by version number ascending, with unknown versions at the end
        if (!a.versionNumber && !b.versionNumber) return 0
        if (!a.versionNumber) return 1
        if (!b.versionNumber) return -1

        // Parse version numbers for proper numeric sorting
        const aVersion = parseFloat(a.versionNumber)
        const bVersion = parseFloat(b.versionNumber)

        return aVersion - bVersion
      })
  }, [statistics.antVersionCounts, moduleIdToVersion])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: 'ANT Count',
        color: 'hsl(var(--chart-1))',
      },
    }
    return config
  }, [])

  if (chartData.length === 0) {
    return (
      <div
        className={`rounded-lg border bg-card p-6 text-card-foreground shadow-sm ${className}`}
      >
        <div className="flex flex-col space-y-1.5 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold leading-none tracking-tight">
                ANT Version Distribution
              </h3>
              <p className="text-sm text-muted-foreground">
                Loading ANT version statistics...
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCSVExport}
                disabled={true}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  const totalANTs = chartData.reduce((sum, item) => sum + item.count, 0)

  return (
    <div
      className={`rounded-lg border bg-card p-6 text-card-foreground shadow-sm ${className}`}
    >
      <div className="flex flex-col space-y-1.5 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold leading-none tracking-tight">
              ANT Version Distribution
            </h3>
            <p className="text-sm text-muted-foreground">
              Distribution of {totalANTs} ANTs across different module versions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCSVExport}
              disabled={chartData.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[400px]">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          }}
        >
          <XAxis type="number" />
          <YAxis
            dataKey="moduleId"
            type="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            width={100}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value, _name, props) => {
                  const payload = props.payload
                  const versionNumber = payload?.versionNumber
                  const moduleId = payload?.fullModuleId

                  return [
                    `${value} ANTs (${payload?.percentage || 0}%)`,
                    versionNumber
                      ? `Version: v${versionNumber}`
                      : `Module: ${moduleId || 'Unknown'}`,
                  ]
                }}
                hideLabel
              />
            }
          />
          <Bar dataKey="count" radius={4}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total ANTs:</span>
          <span className="font-medium">{totalANTs}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Unique Versions:</span>
          <span className="font-medium">{chartData.length}</span>
        </div>
        {statistics.latestVersion && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Latest Version:</span>
            <div className="flex items-center gap-2">
              <Link
                to="/modules"
                className="font-mono text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {statistics.latestVersion.slice(0, 12)}...
              </Link>
              <button
                onClick={copyLatestVersion}
                className="rounded p-1 transition-colors hover:bg-gray-100"
                title="Copy full module ID"
              >
                {copiedLatestVersion ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
