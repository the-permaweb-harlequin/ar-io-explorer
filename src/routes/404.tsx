import { createRoute } from '@tanstack/react-router'

import { NotFound } from '@/components/NotFound'

export default function NotFoundRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '*',
    component: NotFound,
    errorComponent: NotFound,
  })
}
