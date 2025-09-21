import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Search, 
  Database, 
  FileText, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Activity,
  Wallet
} from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Explorer', href: '/explorer', icon: Search },
  { name: 'Transactions', href: '/transactions', icon: Activity },
  { name: 'Blocks', href: '/blocks', icon: Layers },
  { name: 'Data Items', href: '/data-items', icon: Database },
  { name: 'ANS-104', href: '/ans-104', icon: FileText },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed)
  const location = useLocation()

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r bg-background text-foreground transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Database className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">AR.IO Explorer</span>
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
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <item.icon className={cn('h-4 w-4', !sidebarCollapsed && 'mr-3')} />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        {!sidebarCollapsed && (
          <div className="text-xs text-muted-foreground">
            <p>AR.IO Explorer v1.0.0</p>
            <p>Harlequin Toolkit</p>
          </div>
        )}
      </div>
    </div>
  )
}
