import { Link, useLocation } from '@tanstack/react-router'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Code,
  Cpu,
  Database,
  FileCode,
  FileText,
  Globe,
  Layers,
  Network,
  Terminal,
  Upload,
  Wallet,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'

const navigationSections = [
  {
    name: 'AO',
    items: [
      { name: 'Processes', href: '/processes', icon: Cpu },
      { name: 'Messages', href: '/messages', icon: Network },
      { name: 'Modules', href: '/modules', icon: Layers },
      { name: 'AOS', href: '/aos', icon: Terminal },
      { name: 'Hyperbeam', href: '/hyperbeam', icon: Zap },
    ],
  },
  {
    name: 'ArNS',
    items: [
      { name: 'Names', href: '/names', icon: Globe },
      { name: 'ANTs', href: '/ants', icon: FileText },
      { name: 'ANT Registry', href: '/ant-registry', icon: Database },
      { name: 'Gateways', href: '/gateways', icon: Network },
    ],
  },
  {
    name: 'Tools',
    items: [
      { name: 'ANS-104', href: '/ans-104', icon: FileText },
      { name: 'GraphQL', href: '/graphql', icon: Code },
      { name: 'Parquet', href: '/parquet', icon: BarChart3 },
      { name: 'Upload', href: '/upload', icon: Upload },
      { name: 'UDL', href: '/udl', icon: FileCode },
      { name: 'Wallet', href: '/wallet', icon: Wallet },
    ],
  },
]

export function Sidebar() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed)
  const location = useLocation()

  return (
    <div
      className={cn(
        'border-border bg-background text-foreground flex h-full flex-col border-r transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Sidebar Header */}
      <div className="border-border flex h-16 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Database className="text-primary-foreground h-4 w-4" />
            </div>
            <span className="overflow-hidden text-lg font-semibold text-ellipsis whitespace-nowrap">
              AR.IO Explorer
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-8 w-8 p-0"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-2">
        {navigationSections.map((section) => (
          <div key={section.name} className="space-y-1">
            {!sidebarCollapsed && (
              <h3 className="text-muted-foreground px-3 text-xs font-semibold tracking-wider uppercase">
                {section.name}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground',
                      sidebarCollapsed && 'justify-center px-2',
                    )}
                  >
                    <item.icon
                      className={cn('h-4 w-4', !sidebarCollapsed && 'mr-3')}
                    />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-border border-t p-4">
        {!sidebarCollapsed && (
          <div className="text-muted-foreground text-xs">
            <p>AR.IO Explorer v1.0.0</p>
            <p>Harlequin Toolkit</p>
          </div>
        )}
      </div>
    </div>
  )
}
