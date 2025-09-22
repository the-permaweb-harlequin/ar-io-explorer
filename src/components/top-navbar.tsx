import { ConnectButton } from '@project-kardeshev/ao-wallet-kit'
import { Link } from '@tanstack/react-router'
import { Home, Search, Settings } from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store/app-store'

export function TopNavbar() {
  const searchQuery = useAppStore((state) => state.searchQuery)
  const setSearchQuery = useAppStore((state) => state.setSearchQuery)

  return (
    <header className="border-color-border bg-background flex h-16 items-center justify-between border-b px-6">
      {/* Search Bar */}
      <div className="flex flex-1 items-center space-x-4">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search transactions, blocks, addresses..."
            className="pr-4 pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Dashboard Link */}
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
        </Link>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Settings */}
        <Link to="/settings">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Wallet Connection */}
        <ConnectButton />
      </div>
    </header>
  )
}
