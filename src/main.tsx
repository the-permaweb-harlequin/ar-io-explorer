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

import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider'
import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx'
import reportWebVitals from './reportWebVitals.ts'
import NotFoundRoute from './routes/404.tsx'
import SettingsRoute from './routes/settings.tsx'
import './styles.css'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
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
  notFoundRoute: NotFoundRoute(rootRoute),
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
