import { createRoute } from '@tanstack/react-router'

import { ProcessesTable } from '@/components/ProcessesTable'

export default function ProcessesRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/processes',
    component: ProcessesTable,
  })
}
