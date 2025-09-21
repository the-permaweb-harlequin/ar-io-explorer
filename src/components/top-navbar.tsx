import { Bell, Search, User } from 'lucide-react'
import { ConnectButton, useAddress } from '@project-kardeshev/ao-wallet-kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAppStore } from '@/store/app-store'

export function TopNavbar() {
  const searchQuery = useAppStore((state) => state.searchQuery)
  const setSearchQuery = useAppStore((state) => state.setSearchQuery)
  const walletAddress = useAddress()

  const getAddressDisplay = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
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
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle />


        {/* Wallet Connection */}
       <ConnectButton />


      </div>
    </header>
  )
}
