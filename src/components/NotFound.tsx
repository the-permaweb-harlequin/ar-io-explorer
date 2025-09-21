import { Link } from '@tanstack/react-router'
import { Home, Search, Database, Blocks, FileText, Wallet, Settings } from 'lucide-react'
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Header */}
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-foreground mb-2">Page Not Found</h2>
          <p className="text-lg text-muted-foreground">
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
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>

        {/* Suggested Pages */}
        <div className="text-left">
          <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
            Explore These Pages Instead
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedPages.map((page) => {
              const Icon = page.icon
              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className="block p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground mb-1">
                        {page.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
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
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
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
