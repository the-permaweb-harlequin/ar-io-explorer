import { createRoute } from '@tanstack/react-router'

import { MessagesTable } from '@/components/MessagesTable'
import { Layout } from '@/components/layout'

export default function MessagesRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/messages',
    component: () => (
      <Layout>
        <MessagesTable />
      </Layout>
    ),
  })
}
