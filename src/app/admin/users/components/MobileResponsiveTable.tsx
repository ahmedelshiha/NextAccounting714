'use client'

import React, { useState, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { List, Grid3x3 } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface Column<T> {
  key: keyof T
  label: string
  render?: (value: any, item: T) => ReactNode
  hidden?: boolean
  hiddenOn?: ('mobile' | 'tablet' | 'desktop')[]
}

interface MobileResponsiveTableProps<T extends { id: string }> {
  title: string
  description?: string
  items: T[]
  columns: Column<T>[]
  isLoading?: boolean
  onRowClick?: (item: T) => void
  renderCardContent?: (item: T) => ReactNode
  renderRowContent?: (item: T) => ReactNode
  emptyMessage?: string
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectItem?: (id: string, selected: boolean) => void
  allowViewToggle?: boolean
}

export function MobileResponsiveTable<T extends { id: string }>({
  title,
  description,
  items,
  columns,
  isLoading = false,
  onRowClick,
  renderCardContent,
  renderRowContent,
  emptyMessage = 'No items found',
  selectable = false,
  selectedIds = new Set(),
  onSelectItem,
  allowViewToggle = false
}: MobileResponsiveTableProps<T>) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

  // Determine which view to show
  const showCardView = (isMobile && viewMode === 'card') || (isMobile && !allowViewToggle)
  const visibleColumns = columns.filter(col => {
    if (col.hiddenOn?.includes('mobile') && isMobile) return false
    if (col.hiddenOn?.includes('tablet') && isTablet && !isMobile) return false
    return !col.hidden
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {allowViewToggle && isMobile && (
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
              aria-label="Card view"
              title="Card view"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2" role="status" aria-label="Loading">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-500 text-sm" role="status">
            {emptyMessage}
          </div>
        ) : showCardView ? (
          <div className="space-y-3" role="grid" aria-label={`${title} card view`}>
            {items.map(item => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onRowClick?.(item)}
                role="gridcell"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onRowClick?.(item)
                  }
                }}
              >
                {renderCardContent ? (
                  renderCardContent(item)
                ) : (
                  <div className="space-y-2">
                    {visibleColumns.map(col => (
                      <div key={String(col.key)} className="flex justify-between items-start gap-2">
                        <span className="text-sm font-medium text-gray-600">{col.label}</span>
                        <span className="text-sm text-gray-900 text-right flex-1">
                          {col.render ? col.render((item as any)[col.key], item) : (item as any)[col.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {selectable && (
                    <th className="text-left py-3 px-3 font-medium">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && items.every(item => selectedIds.has(item.id))}
                        onChange={(e) => {
                          items.forEach(item => onSelectItem?.(item.id, e.target.checked))
                        }}
                        aria-label="Select all items"
                        className="rounded"
                      />
                    </th>
                  )}
                  {visibleColumns.map(col => (
                    <th key={String(col.key)} className="text-left py-3 px-3 font-medium">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onRowClick?.(item)}
                    role="row"
                  >
                    {selectable && (
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            onSelectItem?.(item.id, e.target.checked)
                          }}
                          aria-label={`Select item ${item.id}`}
                          className="rounded"
                        />
                      </td>
                    )}
                    {visibleColumns.map(col => (
                      <td key={String(col.key)} className="py-3 px-3 text-gray-900">
                        {col.render ? col.render((item as any)[col.key], item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
