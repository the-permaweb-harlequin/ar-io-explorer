import { Link } from '@tanstack/react-router'
import { Blocks, Database, FileText, Home, Search, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function NotFound() {
  const suggestedPages = [
    {
      title: 'Dashboard',
      description: 'View network statistics and recent activity',
      path: '/',
      icon: Home,
    },
    {
      title: 'Explorer',
      description: 'Search and explore the Arweave network',
      path: '/explorer',
      icon: Search,
    },
    {
      title: 'Transactions',
      description: 'Browse transaction history and details',
      path: '/transactions',
      icon: FileText,
    },
    {
      title: 'Blocks',
      description: 'Explore block information and mining data',
      path: '/blocks',
      icon: Blocks,
    },
    {
      title: 'Data Items',
      description: 'View ANS-104 data items and bundles',
      path: '/data-items',
      icon: Database,
    },
    {
      title: 'Wallet',
      description: 'Connect and manage your Arweave wallet',
      path: '/wallet',
      icon: Wallet,
    },
  ]

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* 404 Header */}
        <div className="mb-8">
          <h1 className="text-primary mb-4 text-8xl font-bold">404</h1>
          <h2 className="text-foreground mb-2 text-3xl font-semibold">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <Link to="/">
            <Button size="lg" className="mr-4">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>

        {/* Suggested Pages */}
        <div className="text-left">
          <h3 className="text-foreground mb-6 text-center text-xl font-semibold">
            Explore These Pages Instead
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {suggestedPages.map((page) => {
              const Icon = page.icon
              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className="border-border bg-card hover:bg-accent block cursor-pointer rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 flex-shrink-0">
                      <Icon className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-card-foreground mb-1 font-medium">
                        {page.title}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {page.description}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-border mt-12 border-t pt-8">
          <p className="text-muted-foreground text-sm">
            Need help? Check out our{' '}
            <Link to="/settings" className="text-primary hover:underline">
              settings
            </Link>{' '}
            or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
