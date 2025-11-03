/**
 * Advanced Filter Types
 * Supports complex filter combinations with AND/OR logic and nested groups
 */

export type FilterOperator = 
  | 'eq' | 'neq' | 'contains' | 'startsWith' | 'endsWith'
  | 'in' | 'notIn' | 'gt' | 'lt' | 'gte' | 'lte' | 'between'
  | 'isEmpty' | 'isNotEmpty' | 'isNull' | 'isNotNull'

export type FilterValueType = 'text' | 'select' | 'multiSelect' | 'date' | 'dateRange' | 'number' | 'boolean'

export type LogicOperator = 'AND' | 'OR'

export interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: any
  valueType: FilterValueType
  label?: string
}

export interface FilterGroup {
  id: string
  logic: LogicOperator
  conditions: FilterCondition[]
  nestedGroups?: FilterGroup[]
}

export interface AdvancedFilterConfig {
  logic: LogicOperator
  groups: FilterGroup[]
  metadata?: {
    appliedAt?: Date
    resultCount?: number
  }
}

export interface FilterPresetDTO {
  id?: string
  tenantId?: string
  name: string
  description?: string
  entityType: string // 'users', 'clients', 'team_members'
  filterConfig: AdvancedFilterConfig
  isPublic?: boolean
  isDefault?: boolean
  icon?: string
  color?: string
  usageCount?: number
  lastUsedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface FilterField {
  name: string
  label: string
  type: FilterValueType
  operators: FilterOperator[]
  options?: Array<{ value: string; label: string }>
  isArray?: boolean
}

export const FILTER_OPERATORS: Record<FilterOperator, string> = {
  eq: 'Equals',
  neq: 'Not Equals',
  contains: 'Contains',
  startsWith: 'Starts With',
  endsWith: 'Ends With',
  in: 'In',
  notIn: 'Not In',
  gt: 'Greater Than',
  lt: 'Less Than',
  gte: 'Greater Than or Equal',
  lte: 'Less Than or Equal',
  between: 'Between',
  isEmpty: 'Is Empty',
  isNotEmpty: 'Is Not Empty',
  isNull: 'Is Null',
  isNotNull: 'Is Not Null',
}

export const USER_FILTER_FIELDS: FilterField[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    operators: ['contains', 'startsWith', 'eq', 'neq'],
  },
  {
    name: 'email',
    label: 'Email',
    type: 'text',
    operators: ['contains', 'startsWith', 'eq', 'neq'],
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    operators: ['eq', 'neq', 'in', 'notIn'],
    options: [
      { value: 'ADMIN', label: 'Admin' },
      { value: 'TEAM_LEAD', label: 'Team Lead' },
      { value: 'TEAM_MEMBER', label: 'Team Member' },
      { value: 'STAFF', label: 'Staff' },
      { value: 'CLIENT', label: 'Client' },
    ],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    operators: ['eq', 'neq', 'in', 'notIn'],
    options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'SUSPENDED', label: 'Suspended' },
    ],
  },
  {
    name: 'department',
    label: 'Department',
    type: 'text',
    operators: ['contains', 'eq', 'neq'],
  },
  {
    name: 'tier',
    label: 'Tier',
    type: 'select',
    operators: ['eq', 'neq', 'in', 'notIn'],
    options: [
      { value: 'INDIVIDUAL', label: 'Individual' },
      { value: 'SMB', label: 'Small Business' },
      { value: 'ENTERPRISE', label: 'Enterprise' },
    ],
  },
  {
    name: 'createdAt',
    label: 'Created Date',
    type: 'dateRange',
    operators: ['between', 'gt', 'lt', 'gte', 'lte'],
  },
  {
    name: 'experienceYears',
    label: 'Years of Experience',
    type: 'number',
    operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'],
  },
  {
    name: 'hourlyRate',
    label: 'Hourly Rate',
    type: 'number',
    operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'between'],
  },
]

export function createEmptyFilterCondition(): FilterCondition {
  return {
    id: `cond-${Date.now()}`,
    field: '',
    operator: 'eq',
    value: '',
    valueType: 'text',
  }
}

export function createEmptyFilterGroup(): FilterGroup {
  return {
    id: `group-${Date.now()}`,
    logic: 'AND',
    conditions: [createEmptyFilterCondition()],
    nestedGroups: [],
  }
}

export function createEmptyFilterConfig(): AdvancedFilterConfig {
  return {
    logic: 'AND',
    groups: [createEmptyFilterGroup()],
  }
}
