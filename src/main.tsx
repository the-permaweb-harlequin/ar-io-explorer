import { StrictMode } from 'react'

import {
  AOWalletKit,
  ArConnectStrategy,
  ArweaveWebWalletStrategy,
  ethereumStrategy,
} from '@project-kardeshev/ao-wallet-kit'
import {
  Outlet,
  RouterProvider,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import ReactDOM from 'react-dom/client'

import Dashboard from './Dashboard.tsx'
import { NotFound } from './components/NotFound.tsx'
import { Layout } from './components/layout.tsx'
import { ThemeProvider } from './components/theme-provider'
import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'
import reportWebVitals from './reportWebVitals.ts'
import NotFoundRoute from './routes/404.tsx'
import ARFSExplorerRoute from './routes/arfs-explorer.tsx'
import ARFSParquetNotebookRoute from './routes/arfs-parquet-notebook.tsx'
import MessagesRoute from './routes/messages.tsx'
import ModulesRoute from './routes/modules.tsx'
import ProcessesRoute from './routes/processes.tsx'
import SettingsRoute from './routes/settings.tsx'
import './styles.css'

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
      <TanStackRouterDevtools />
    </Layout>
  ),
  notFoundComponent: () => <NotFound />,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-6xl font-bold text-destructive">Error</h1>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mb-6 text-muted-foreground">
          An unexpected error occurred. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="hover:bg-primary/90 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          Refresh Page
        </button>
      </div>
    </div>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  ProcessesRoute(rootRoute),
  MessagesRoute(rootRoute),
  ModulesRoute(rootRoute),
  ARFSExplorerRoute(rootRoute),
  ARFSParquetNotebookRoute(rootRoute),
  SettingsRoute(rootRoute),
  NotFoundRoute(rootRoute),
])

const TanStackQueryProviderContext = TanStackQueryProvider.getContext()
const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context: {
    ...TanStackQueryProviderContext,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <AOWalletKit
        strategies={[
          new ArConnectStrategy(),
          ethereumStrategy,
          new ArweaveWebWalletStrategy(),
        ]}
        config={{
          permissions: [
            'ACCESS_ADDRESS',
            'ACCESS_ALL_ADDRESSES',
            'ACCESS_PUBLIC_KEY',
            'SIGN_TRANSACTION',
            'SIGNATURE',
          ],
        }}
        theme={{
          displayTheme: 'dark',
          accent: {
            r: 0,
            g: 0,
            b: 0,
          },
          titleHighlight: {
            r: 0,
            g: 0,
            b: 0,
          },
          radius: 'minimal',
        }}
      >
        <ThemeProvider>
          <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
            <RouterProvider router={router} />
          </TanStackQueryProvider.Provider>
        </ThemeProvider>
      </AOWalletKit>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
