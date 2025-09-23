import { createRoute } from '@tanstack/react-router'

import { MessagesTable } from '@/components/MessagesTable'

export default function MessagesRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/messages',
    component: MessagesTable,
  })
}
