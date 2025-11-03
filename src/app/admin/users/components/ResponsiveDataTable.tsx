'use client'

import React, { ReactNode, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export interface ResponsiveColumn<T> {
  key: keyof T | string
  label: string
  render?: (value: any, item: T) => ReactNode
  priority: 'high' | 'medium' | 'low'
  minWidth?: string
  align?: 'left' | 'center' | 'right'
}

interface ResponsiveDataTableProps<T extends { id: string }> {
  title: string
  description?: string
  columns: ResponsiveColumn<T>[]
  data: T[]
  isLoading?: boolean
  onRowClick?: (item: T) => void
  renderCustomRow?: (item: T) => ReactNode
  emptyMessage?: string
  keyExtractor?: (item: T) => string
}

/**
 * Responsive Data Table Component
 * 
 * Automatically hides low-priority columns on smaller screens:
 * - Desktop (1024px+): All columns
 * - Tablet (640px-1024px): High + Medium priority columns
 * - Mobile (<640px): High priority columns only
 */
export function ResponsiveDataTable<T extends { id: string }>({
  title,
  description,
  columns,
  data,
  isLoading,
  onRowClick,
  renderCustomRow,
  emptyMessage = 'No data found',
  keyExtractor = (item) => item.id
}: ResponsiveDataTableProps<T>) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')

  const visibleColumns = columns.filter(col => {
    if (isMobile && col.priority === 'low') return false
    if (isTablet && col.priority === 'low') return false
    return true
  })

  const renderLoadingSkeleton = useCallback(() => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  ), [])

  const renderEmptyState = useCallback(() => (
    <div className="py-8 text-center text-gray-500 text-sm">
      {emptyMessage}
    </div>
  ), [emptyMessage])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {renderLoadingSkeleton()}
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {renderEmptyState()}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {visibleColumns.map(col => (
                  <th
                    key={String(col.key)}
                    className={`px-4 py-3 font-medium text-gray-900 text-${col.align || 'left'}`}
                    style={{ minWidth: col.minWidth || 'auto' }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr
                  key={keyExtractor(item)}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(item)}
                  role="row"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick?.(item)
                    }
                  }}
                >
                  {renderCustomRow ? (
                    <td colSpan={visibleColumns.length} className="px-4 py-3">
                      {renderCustomRow(item)}
                    </td>
                  ) : (
                    visibleColumns.map(col => (
                      <td
                        key={String(col.key)}
                        className={`px-4 py-3 text-gray-900 text-${col.align || 'left'}`}
                      >
                        {col.render
                          ? col.render((item as any)[col.key], item)
                          : (item as any)[col.key]}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
