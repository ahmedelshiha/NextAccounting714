'use client'

import React, { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, Loader2, MoreVertical } from 'lucide-react'
import { usePermissions } from '@/lib/use-permissions'
import { UserItem } from '../contexts/UsersContextProvider'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface UserActionsProps {
  user: UserItem
  onViewProfile: (user: UserItem) => void
  isLoading?: boolean
}

export const UserActions = memo(function UserActions({
  user,
  onViewProfile,
  isLoading = false
}: UserActionsProps) {
  const perms = usePermissions()
  const isMobile = useMediaQuery('(max-width: 640px)')

  const handleViewProfile = useCallback(() => {
    onViewProfile(user)
  }, [user, onViewProfile])

  if (!perms.canManageUsers) {
    return null
  }

  // Mobile: Show icon-only button with larger touch target
  if (isMobile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewProfile}
              disabled={isLoading}
              className="h-9 w-9 p-0 shrink-0"
              aria-label="View profile"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>View profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Desktop: Show button with icon and text
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewProfile}
            disabled={isLoading}
            className="h-8 px-2 gap-1 shrink-0"
            aria-label="View profile"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span>View</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>View user profile</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

UserActions.displayName = 'UserActions'
