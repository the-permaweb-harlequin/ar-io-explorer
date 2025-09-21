import { createRoute } from '@tanstack/react-router'
import { NotFound } from '@/components/NotFound'
import { Layout } from '@/components/layout'

export default function NotFoundRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/404',
    component: () => (
      <Layout>
        <NotFound />
      </Layout>
    ),
  })
}
