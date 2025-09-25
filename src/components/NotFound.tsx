import { Link } from '@tanstack/react-router'
import {
  BarChart3,
  Code,
  Cpu,
  Database,
  FileCode,
  FileText,
  FolderOpen,
  Globe,
  Home,
  Layers,
  Network,
  NotebookPen,
  Settings,
  Terminal,
  Upload,
  Wallet,
  Zap,
} from 'lucide-react'

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
      title: 'Settings',
      description: 'Configure application endpoints and services',
      path: '/settings',
      icon: Settings,
    },
    // AO Section
    {
      title: 'AO Processes',
      description: 'Explore AO processes and their states',
      path: '/processes',
      icon: Cpu,
    },
    {
      title: 'AO Messages',
      description: 'View messages between AO processes',
      path: '/messages',
      icon: Network,
    },
    {
      title: 'AO Modules',
      description: 'Browse AO modules and their specifications',
      path: '/modules',
      icon: Layers,
    },
    {
      title: 'AOS',
      description: 'Access the AO operating system interface',
      path: '/aos',
      icon: Terminal,
    },
    {
      title: 'Hyperbeam',
      description: 'High-performance AO message streaming',
      path: '/hyperbeam',
      icon: Zap,
    },
    // ArNS Section
    {
      title: 'ArNS Names',
      description: 'Browse Arweave Name System registrations',
      path: '/names',
      icon: Globe,
    },
    {
      title: 'ANTs',
      description: 'Explore Arweave Name Tokens',
      path: '/ants',
      icon: FileText,
    },
    {
      title: 'ANT Registry',
      description: 'Browse the ANT registry and ownership records',
      path: '/ant-registry',
      icon: Database,
    },
    {
      title: 'Gateways',
      description: 'View AR.IO gateway network status',
      path: '/gateways',
      icon: Network,
    },
    // ArFS Section
    {
      title: 'ArFS Explorer',
      description: 'Browse Arweave File System (ArFS) drives',
      path: '/arfs/explorer',
      icon: FolderOpen,
    },
    {
      title: 'ARFS Parquet Notebook',
      description: 'Explore ARFS data with SQL queries on parquet files',
      path: '/arfs/parquet-notebook',
      icon: NotebookPen,
    },
    // Tools Section
    {
      title: 'ANS-104 Viewer',
      description: 'Decode and inspect ANS-104 data items',
      path: '/ans-104',
      icon: FileText,
    },
    {
      title: 'GraphQL',
      description: 'Query Arweave data with GraphQL',
      path: '/graphql',
      icon: Code,
    },
    {
      title: 'Parquet Explorer',
      description: 'Analyze Arweave data in Parquet format',
      path: '/parquet',
      icon: BarChart3,
    },
    {
      title: 'Upload Tool',
      description: 'Upload data to the Arweave network',
      path: '/upload',
      icon: Upload,
    },
    {
      title: 'UDL',
      description: 'Universal Data License tools and utilities',
      path: '/udl',
      icon: FileCode,
    },
    {
      title: 'Wallet Manager',
      description: 'Connect and manage your Arweave wallet',
      path: '/wallet',
      icon: Wallet,
    },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-4xl text-center">
        {/* 404 Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-8xl font-bold text-primary">404</h1>
          <h2 className="mb-2 text-3xl font-semibold text-foreground">
            Page Not Found
          </h2>
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
          <h3 className="mb-6 text-center text-xl font-semibold text-foreground">
            Explore These Pages Instead
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suggestedPages.map((page) => {
              const Icon = page.icon
              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className="block cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-medium text-card-foreground">
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
        <div className="mt-12 border-t border-border pt-8">
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
