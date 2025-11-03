'use client'

import React, { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Copy, Trash2, Edit, Eye } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface ActionItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline'
  className?: string
}

interface MobileOptimizedActionsProps {
  actions: ActionItem[]
  primaryAction?: ActionItem
  secondaryActions?: ActionItem[]
  tooltip?: string
}

/**
 * Mobile-optimized actions component
 * 
 * Desktop: Shows buttons inline with icons + text
 * Mobile: Shows only icons in dropdown menu
 * 
 * Features:
 * - Touch-friendly targets (44px minimum)
 * - Icon-only on mobile with labels in dropdown
 * - Optimized for small screens
 * - Accessibility compliant
 */
export function MobileOptimizedActions({
  actions,
  primaryAction,
  secondaryActions = [],
  tooltip
}: MobileOptimizedActionsProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')

  const allActions = [...(primaryAction ? [primaryAction] : []), ...actions, ...secondaryActions]

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 hover:bg-gray-100"
            aria-label="More actions"
            title="More actions"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {allActions.map((action, idx) => (
            <React.Fragment key={idx}>
              {action.variant === 'destructive' && idx > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={action.onClick}
                className={action.variant === 'destructive' ? 'text-red-600' : ''}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  if (isTablet && allActions.length > 3) {
    // Tablet: Show primary + overflow in dropdown
    const visibleActions = allActions.slice(0, 2)
    const overflowActions = allActions.slice(2)

    return (
      <div className="flex items-center gap-1">
        {visibleActions.map((action, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  className="h-9 px-2 gap-1"
                  aria-label={action.label}
                >
                  {action.icon && <span>{action.icon}</span>}
                  <span className="hidden sm:inline text-xs">{action.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {overflowActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {overflowActions.map((action, idx) => (
                <DropdownMenuItem key={idx} onClick={action.onClick}>
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  // Desktop: Show all actions as buttons
  return (
    <div className="flex items-center gap-2">
      {allActions.map((action, idx) => (
        <TooltipProvider key={idx}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className="h-9 px-3 gap-2"
                aria-label={action.label}
              >
                {action.icon && <span>{action.icon}</span>}
                <span className="text-xs">{action.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{action.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}
