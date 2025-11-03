import { AdvancedFilterConfig, FilterGroup, FilterCondition, FILTER_OPERATORS } from '../types/filters'

/**
 * Convert filter configuration to human-readable format
 * Example: "Role equals Admin AND Department contains Sales"
 */
export function filterConfigToHumanReadable(config: AdvancedFilterConfig): string {
  if (!config.groups || config.groups.length === 0) {
    return 'No filters applied'
  }

  const groupStrings = config.groups.map((group) =>
    filterGroupToHumanReadable(group)
  )

  if (groupStrings.length === 1) {
    return groupStrings[0]
  }

  return groupStrings.join(` ${config.logic} `)
}

function filterGroupToHumanReadable(group: FilterGroup): string {
  if (!group.conditions || group.conditions.length === 0) {
    return ''
  }

  const conditionStrings = group.conditions
    .filter((c) => c.field) // Skip empty conditions
    .map((condition) => filterConditionToHumanReadable(condition))

  if (conditionStrings.length === 0) {
    return ''
  }

  if (conditionStrings.length === 1) {
    return conditionStrings[0]
  }

  return `(${conditionStrings.join(` ${group.logic} `)})`
}

function filterConditionToHumanReadable(condition: FilterCondition): string {
  const fieldLabel = condition.label || condition.field
  const operatorLabel = FILTER_OPERATORS[condition.operator] || condition.operator
  const valueStr = formatConditionValue(condition.value, condition.valueType)

  if (['isEmpty', 'isNotEmpty', 'isNull', 'isNotNull'].includes(condition.operator)) {
    return `${fieldLabel} ${operatorLabel}`
  }

  return `${fieldLabel} ${operatorLabel} ${valueStr}`
}

function formatConditionValue(value: any, valueType: string): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (valueType === 'date' && value instanceof Date) {
    return value.toLocaleDateString()
  }

  if (valueType === 'dateRange' && Array.isArray(value) && value.length === 2) {
    return `${new Date(value[0]).toLocaleDateString()} - ${new Date(value[1]).toLocaleDateString()}`
  }

  return String(value)
}

/**
 * Convert filter config to SQL WHERE clause (for debugging)
 */
export function filterConfigToSQL(config: AdvancedFilterConfig): string {
  if (!config.groups || config.groups.length === 0) {
    return '1=1' // No filters
  }

  const groupClauses = config.groups
    .map((group) => filterGroupToSQL(group))
    .filter((clause) => clause.length > 0)

  if (groupClauses.length === 0) {
    return '1=1'
  }

  return groupClauses.join(` ${config.logic} `)
}

function filterGroupToSQL(group: FilterGroup): string {
  const conditions = group.conditions
    .filter((c) => c.field) // Skip empty conditions
    .map((c) => filterConditionToSQL(c))
    .filter((clause) => clause.length > 0)

  if (conditions.length === 0) {
    return ''
  }

  const clause = conditions.join(` ${group.logic} `)
  return conditions.length > 1 ? `(${clause})` : clause
}

function filterConditionToSQL(condition: FilterCondition): string {
  const field = `\`${condition.field}\``

  switch (condition.operator) {
    case 'eq':
      return `${field} = '${escapeSQL(condition.value)}'`
    case 'neq':
      return `${field} != '${escapeSQL(condition.value)}'`
    case 'contains':
      return `${field} LIKE '%${escapeSQL(condition.value)}%'`
    case 'startsWith':
      return `${field} LIKE '${escapeSQL(condition.value)}%'`
    case 'endsWith':
      return `${field} LIKE '%${escapeSQL(condition.value)}'`
    case 'in':
      const inValues = Array.isArray(condition.value)
        ? condition.value.map((v) => `'${escapeSQL(v)}'`).join(',')
        : `'${escapeSQL(condition.value)}'`
      return `${field} IN (${inValues})`
    case 'notIn':
      const notInValues = Array.isArray(condition.value)
        ? condition.value.map((v) => `'${escapeSQL(v)}'`).join(',')
        : `'${escapeSQL(condition.value)}'`
      return `${field} NOT IN (${notInValues})`
    case 'gt':
      return `${field} > ${condition.value}`
    case 'lt':
      return `${field} < ${condition.value}`
    case 'gte':
      return `${field} >= ${condition.value}`
    case 'lte':
      return `${field} <= ${condition.value}`
    case 'between':
      const [start, end] = Array.isArray(condition.value) ? condition.value : [null, null]
      return start && end ? `${field} BETWEEN ${start} AND ${end}` : ''
    case 'isEmpty':
      return `${field} = '' OR ${field} IS NULL`
    case 'isNotEmpty':
      return `${field} != '' AND ${field} IS NOT NULL`
    case 'isNull':
      return `${field} IS NULL`
    case 'isNotNull':
      return `${field} IS NOT NULL`
    default:
      return ''
  }
}

function escapeSQL(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).replace(/'/g, "''")
}

/**
 * Get a compact representation of filter (for UI badges)
 */
export function getFilterCompactLabel(config: AdvancedFilterConfig): string {
  const totalConditions = config.groups.reduce(
    (sum, group) => sum + group.conditions.length,
    0
  )
  return `${totalConditions} filter${totalConditions !== 1 ? 's' : ''}`
}

/**
 * Check if filter is empty or has no valid conditions
 */
export function isFilterEmpty(config: AdvancedFilterConfig): boolean {
  if (!config.groups || config.groups.length === 0) {
    return true
  }

  return config.groups.every((group) =>
    group.conditions.every((condition) => !condition.field)
  )
}
