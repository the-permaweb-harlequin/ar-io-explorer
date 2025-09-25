import { Tag, X } from 'lucide-react'

import type { FilterTag } from '@/components/FilterModal'
import { Button } from '@/components/ui/button'

export interface FilterTagsProps {
  filters: FilterTag[]
  onRemoveFilter: (id: string) => void
  onClearAll: () => void
  actionFilter?: string
  typeFilter?: string
  onRemoveActionFilter?: () => void
  onRemoveTypeFilter?: () => void
}

export function FilterTags({
  filters,
  onRemoveFilter,
  onClearAll,
  actionFilter,
  typeFilter,
  onRemoveActionFilter,
  onRemoveTypeFilter,
}: FilterTagsProps) {
  const hasFilters = filters.length > 0 || actionFilter || typeFilter

  if (!hasFilters) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>

      {/* Action Filter Tag */}
      {actionFilter && (
        <div className="inline-flex items-center space-x-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
          <Tag className="h-3 w-3" />
          <span>Action: {actionFilter}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground/70 h-4 w-4 p-0 hover:text-primary-foreground"
            onClick={onRemoveActionFilter}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Type Filter Tag */}
      {typeFilter && (
        <div className="inline-flex items-center space-x-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
          <Tag className="h-3 w-3" />
          <span>Type: {typeFilter}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground/70 h-4 w-4 p-0 hover:text-primary-foreground"
            onClick={onRemoveTypeFilter}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Advanced Filter Tags */}
      {filters.map((filter) => (
        <div
          key={filter.id}
          className="inline-flex items-center space-x-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
        >
          <Tag className="h-3 w-3" />
          <span>
            {filter.type === 'tag' && `${filter.name}: ${filter.value}`}
            {filter.type === 'recipient' && `To: ${filter.address}`}
            {filter.type === 'owner' && `From: ${filter.address}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground/70 h-4 w-4 p-0 hover:text-primary-foreground"
            onClick={() => onRemoveFilter(filter.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Clear All Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  )
}
