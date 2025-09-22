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
    <header className="border-color-border flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Search Bar */}
      <div className="flex flex-1 items-center space-x-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions, blocks, addresses..."
            className="pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Dashboard Link */}
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2"
          asChild
        >
          <Link to="/">
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </Button>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Settings */}
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0" asChild>
          <Link to="/settings">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Link>
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Wallet Connection */}
        <ConnectButton />
      </div>
    </header>
  )
}
