import { createRoute } from '@tanstack/react-router'

import { ModulesTable } from '@/components/ModulesTable'
import { Layout } from '@/components/layout'

export default function ModulesRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/modules',
    component: () => (
      <Layout>
        <ModulesTable />
      </Layout>
    ),
  })
}
