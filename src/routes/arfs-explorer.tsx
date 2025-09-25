import { createRoute } from '@tanstack/react-router'

import { ARFSExplorer } from '@/components/ARFSExplorer'

export default function ARFSExplorerRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/arfs/explorer',
    component: ARFSExplorer,
  })
}
