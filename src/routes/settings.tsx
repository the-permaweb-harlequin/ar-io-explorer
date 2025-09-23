import { createRoute } from '@tanstack/react-router'

import { Settings } from '@/components/Settings'

export default function SettingsRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/settings',
    component: Settings,
  })
}
