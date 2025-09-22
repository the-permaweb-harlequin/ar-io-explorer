import { useState } from 'react'

import { Plus, Tag, User, Users, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface FilterTag {
  id: string
  type: 'tag' | 'recipient' | 'owner'
  name?: string
  value?: string
  address?: string
}

export interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: Array<FilterTag>) => void
  existingFilters: Array<FilterTag>
}

export function FilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  existingFilters,
}: FilterModalProps) {
  const [filters, setFilters] = useState<Array<FilterTag>>(existingFilters)
  const [newTagName, setNewTagName] = useState('')
  const [newTagValue, setNewTagValue] = useState('')
  const [newRecipient, setNewRecipient] = useState('')
  const [newOwner, setNewOwner] = useState('')

  const addTagFilter = () => {
    if (newTagName.trim() && newTagValue.trim()) {
      const newFilter: FilterTag = {
        id: `tag-${Date.now()}`,
        type: 'tag',
        name: newTagName.trim(),
        value: newTagValue.trim(),
      }
      setFilters([...filters, newFilter])
      setNewTagName('')
      setNewTagValue('')
    }
  }

  const addRecipientFilter = () => {
    if (newRecipient.trim()) {
      const newFilter: FilterTag = {
        id: `recipient-${Date.now()}`,
        type: 'recipient',
        address: newRecipient.trim(),
      }
      setFilters([...filters, newFilter])
      setNewRecipient('')
    }
  }

  const addOwnerFilter = () => {
    if (newOwner.trim()) {
      const newFilter: FilterTag = {
        id: `owner-${Date.now()}`,
        type: 'owner',
        address: newOwner.trim(),
      }
      setFilters([...filters, newFilter])
      setNewOwner('')
    }
  }

  const removeFilter = (id: string) => {
    setFilters(filters.filter((filter) => filter.id !== id))
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const handleClear = () => {
    setFilters([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-semibold">Advanced Filters</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] space-y-6 overflow-y-auto p-6">
          {/* Tag Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <h3 className="text-lg font-medium">Tag Filters</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tagName">Tag Name</Label>
                <Input
                  id="tagName"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. Action, Type"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label htmlFor="tagValue">Tag Value</Label>
                <Input
                  id="tagValue"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  placeholder="e.g. Transfer, Message"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <Button
              onClick={addTagFilter}
              disabled={!newTagName.trim() || !newTagValue.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Tag Filter
            </Button>
          </div>

          {/* Recipient Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <h3 className="text-lg font-medium">Recipient Filters</h3>
            </div>
            <div>
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Enter recipient address"
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={addRecipientFilter}
              disabled={!newRecipient.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Recipient Filter
            </Button>
          </div>

          {/* Owner Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <h3 className="text-lg font-medium">Owner Filters</h3>
            </div>
            <div>
              <Label htmlFor="owner">Owner Address</Label>
              <Input
                id="owner"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Enter owner address"
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={addOwnerFilter} disabled={!newOwner.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Owner Filter
            </Button>
          </div>

          {/* Active Filters */}
          {filters.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Active Filters</h3>
              <div className="space-y-2">
                {filters.map((filter) => (
                  <div
                    key={filter.id}
                    className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-2">
                      {filter.type === 'tag' && (
                        <>
                          <Tag className="h-3 w-3" />
                          <span className="font-mono text-sm">
                            {filter.name}: {filter.value}
                          </span>
                        </>
                      )}
                      {filter.type === 'recipient' && (
                        <>
                          <Users className="h-3 w-3" />
                          <span className="font-mono text-sm">
                            Recipient: {filter.address}
                          </span>
                        </>
                      )}
                      {filter.type === 'owner' && (
                        <>
                          <User className="h-3 w-3" />
                          <span className="font-mono text-sm">
                            Owner: {filter.address}
                          </span>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(filter.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t p-6">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={filters.length === 0}
          >
            Clear All
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters ({filters.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
