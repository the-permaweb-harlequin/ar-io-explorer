import { createRoute } from '@tanstack/react-router'

import { ProcessesTable } from '@/components/ProcessesTable'
import { Layout } from '@/components/layout'

export default function ProcessesRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/processes',
    component: () => (
      <Layout>
        <ProcessesTable />
      </Layout>
    ),
  })
}
