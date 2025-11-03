'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Plus, Trash2, Copy, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  AdvancedFilterConfig,
  FilterGroup,
  FilterCondition,
  FilterField,
  USER_FILTER_FIELDS,
  createEmptyFilterCondition,
  createEmptyFilterGroup,
} from '../types/filters'
import { FilterGroupComponent } from './FilterGroup'
import { filterConfigToHumanReadable } from '../utils/filterSerializer'

interface FilterBuilderProps {
  onApply: (config: AdvancedFilterConfig) => void
  onSave?: (config: AdvancedFilterConfig, name: string) => Promise<void>
  initialConfig?: AdvancedFilterConfig
  showPreview?: boolean
  previewCount?: number
  isLoading?: boolean
}

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  onApply,
  onSave,
  initialConfig,
  showPreview = true,
  previewCount,
  isLoading = false,
}) => {
  const [config, setConfig] = useState<AdvancedFilterConfig>(
    initialConfig || {
      logic: 'AND',
      groups: [createEmptyFilterGroup()],
    }
  )
  const [savePresetName, setSavePresetName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const availableFields = useMemo(() => USER_FILTER_FIELDS, [])

  const updateGroup = useCallback(
    (groupId: string, updatedGroup: FilterGroup) => {
      setConfig((prev) => ({
        ...prev,
        groups: prev.groups.map((g) => (g.id === groupId ? updatedGroup : g)),
      }))
    },
    []
  )

  const removeGroup = useCallback((groupId: string) => {
    setConfig((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g.id !== groupId),
    }))
  }, [])

  const addGroup = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      groups: [...prev.groups, createEmptyFilterGroup()],
    }))
  }, [])

  const toggleLogic = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      logic: prev.logic === 'AND' ? 'OR' : 'AND',
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setConfig({
      logic: 'AND',
      groups: [createEmptyFilterGroup()],
    })
  }, [])

  const handleApply = useCallback(() => {
    onApply(config)
  }, [config, onApply])

  const handleSavePreset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!savePresetName.trim() || !onSave) return

      try {
        setIsSaving(true)
        await onSave(config, savePresetName)
        setSavePresetName('')
        setShowSaveForm(false)
      } finally {
        setIsSaving(false)
      }
    },
    [config, savePresetName, onSave]
  )

  const handleCopyFilter = useCallback(() => {
    const filterJson = JSON.stringify(config, null, 2)
    navigator.clipboard.writeText(filterJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [config])

  const filterDescription = useMemo(
    () => filterConfigToHumanReadable(config),
    [config]
  )

  const totalConditions = useMemo(
    () =>
      config.groups.reduce(
        (count, group) =>
          count +
          group.conditions.length +
          (group.nestedGroups?.length || 0),
        0
      ),
    [config]
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advanced Filter Builder</h3>
          <p className="text-sm text-gray-500 mt-1">{filterDescription}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyFilter}
            title="Copy filter configuration"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            title="Reset all filters"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Top-level logic selector */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">Filter Logic:</span>
          <Button
            variant={config.logic === 'AND' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleLogic}
            className="w-16"
          >
            {config.logic}
          </Button>
          <span className="text-xs text-gray-500">
            (All conditions match / Any condition matches)
          </span>
        </div>

        {/* Filter groups */}
        <div className="space-y-3">
          {config.groups.map((group, index) => (
            <div
              key={group.id}
              className="relative border-l-2 border-blue-500 pl-4"
            >
              {index > 0 && (
                <div className="mb-3 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded w-fit">
                  {config.logic}
                </div>
              )}
              <FilterGroupComponent
                group={group}
                onGroupChange={(updated) => updateGroup(group.id, updated)}
                onRemove={() => removeGroup(group.id)}
                availableFields={availableFields}
                isRemovable={config.groups.length > 1}
              />
            </div>
          ))}
        </div>

        {/* Add group button */}
        <Button
          variant="outline"
          size="sm"
          onClick={addGroup}
          className="mt-4 w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Filter Group
        </Button>
      </Card>

      {/* Summary and actions */}
      <Card className="p-4 bg-gray-50">
        <div className="space-y-3">
          {/* Filter summary */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="secondary">{config.groups.length} groups</Badge>
              <Badge variant="secondary">{totalConditions} conditions</Badge>
              {showPreview && previewCount !== undefined && (
                <Badge variant="outline">~{previewCount} results</Badge>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end flex-wrap">
            {onSave && (
              <>
                {!showSaveForm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveForm(true)}
                    disabled={isLoading}
                  >
                    Save Preset
                  </Button>
                ) : (
                  <form
                    onSubmit={handleSavePreset}
                    className="flex gap-2 items-center"
                  >
                    <Input
                      type="text"
                      placeholder="Preset name..."
                      value={savePresetName}
                      onChange={(e) => setSavePresetName(e.target.value)}
                      className="w-32 h-8"
                      autoFocus
                      disabled={isSaving}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!savePresetName.trim() || isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSaveForm(false)
                        setSavePresetName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </form>
                )}
              </>
            )}
            <Button
              onClick={handleApply}
              disabled={isLoading || totalConditions === 0}
            >
              {isLoading ? 'Applying...' : 'Apply Filter'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FilterBuilder
