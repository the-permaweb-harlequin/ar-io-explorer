import { createRoute } from '@tanstack/react-router'

import { ModulesTable } from '@/components/ModulesTable'

export default function ModulesRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/modules',
    component: ModulesTable,
  })
}
