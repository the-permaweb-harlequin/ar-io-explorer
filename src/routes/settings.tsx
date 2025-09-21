import { createRoute } from '@tanstack/react-router'
import { Settings } from '@/components/Settings'
import { Layout } from '@/components/layout'

export default function SettingsRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: () => (
      <Layout>
        <Settings />
      </Layout>
    ),
  })
}
