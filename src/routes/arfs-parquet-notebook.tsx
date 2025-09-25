import { createRoute } from '@tanstack/react-router'

import { ARFSParquetNotebook } from '@/components/ARFSParquetNotebook'

export default function ARFSParquetNotebookRoute(rootRoute: any) {
  return createRoute({
    getParentRoute: () => rootRoute,
    path: '/arfs/parquet-notebook',
    component: ARFSParquetNotebook,
  })
}
