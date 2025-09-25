import { useMemo, useState } from 'react'

import { Link } from '@tanstack/react-router'
import { Check, Copy } from 'lucide-react'
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts'

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
  const [copiedLatestVersion, setCopiedLatestVersion] = useState(false)

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
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            ANT Version Distribution
          </h3>
          <p className="text-sm text-muted-foreground">
            Loading ANT version statistics...
          </p>
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
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          ANT Version Distribution
        </h3>
        <p className="text-sm text-muted-foreground">
          Distribution of {totalANTs} ANTs across different module versions
        </p>
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
