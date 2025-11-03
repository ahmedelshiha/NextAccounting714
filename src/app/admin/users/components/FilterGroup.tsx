'use client'

import React, { useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FilterGroup,
  FilterField,
  createEmptyFilterCondition,
} from '../types/filters'
import { FilterConditionComponent } from './FilterCondition'

interface FilterGroupProps {
  group: FilterGroup
  onGroupChange: (group: FilterGroup) => void
  onRemove: () => void
  availableFields: FilterField[]
  isRemovable?: boolean
}

export const FilterGroupComponent: React.FC<FilterGroupProps> = ({
  group,
  onGroupChange,
  onRemove,
  availableFields,
  isRemovable = true,
}) => {
  const handleToggleLogic = useCallback(() => {
    onGroupChange({
      ...group,
      logic: group.logic === 'AND' ? 'OR' : 'AND',
    })
  }, [group, onGroupChange])

  const handleConditionChange = useCallback(
    (conditionId: string, updatedCondition: any) => {
      onGroupChange({
        ...group,
        conditions: group.conditions.map((c) =>
          c.id === conditionId ? updatedCondition : c
        ),
      })
    },
    [group, onGroupChange]
  )

  const handleRemoveCondition = useCallback(
    (conditionId: string) => {
      const updatedConditions = group.conditions.filter(
        (c) => c.id !== conditionId
      )
      if (updatedConditions.length === 0) {
        updatedConditions.push(createEmptyFilterCondition())
      }
      onGroupChange({
        ...group,
        conditions: updatedConditions,
      })
    },
    [group, onGroupChange]
  )

  const handleAddCondition = useCallback(() => {
    onGroupChange({
      ...group,
      conditions: [...group.conditions, createEmptyFilterCondition()],
    })
  }, [group, onGroupChange])

  return (
    <div className="space-y-2">
      {/* Group header with logic toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleLogic}
          className="w-12 h-8"
        >
          {group.logic}
        </Button>
        {isRemovable && group.conditions.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
            title="Remove this group"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Conditions */}
      <div className="space-y-2 bg-white rounded border border-gray-200 p-3">
        {group.conditions.map((condition, index) => (
          <div key={condition.id} className="space-y-2">
            {index > 0 && (
              <div className="text-xs font-medium text-gray-500 px-2">
                {group.logic}
              </div>
            )}
            <FilterConditionComponent
              condition={condition}
              onConditionChange={(updated) =>
                handleConditionChange(condition.id, updated)
              }
              onRemove={() => handleRemoveCondition(condition.id)}
              availableFields={availableFields}
              isRemovable={group.conditions.length > 1}
            />
          </div>
        ))}

        {/* Add condition button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddCondition}
          className="w-full mt-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Condition
        </Button>
      </div>
    </div>
  )
}

export default FilterGroupComponent
