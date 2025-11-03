import { useState, useCallback, useEffect } from 'react'
import { UserItem } from '../contexts/UserDataContext'

export interface ServerFilterOptions {
  search?: string
  role?: string
  status?: string
  department?: string
  tier?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'name' | 'email'
  sortOrder?: 'asc' | 'desc'
}

export interface ServerFilterResponse {
  users: UserItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface UseServerSideFilteringState {
  data: ServerFilterResponse | null
  loading: boolean
  error: Error | null
  filters: ServerFilterOptions
  setFilters: (filters: ServerFilterOptions) => void
  setPage: (page: number) => void
  refetch: () => Promise<void>
  hasNextPage: boolean
  hasPreviousPage: boolean
  currentPage: number
  totalPages: number
  totalCount: number
}

/**
 * Hook for server-side filtering with pagination
 * Fetches filtered data from API instead of filtering client-side
 * Improves performance for large datasets
 *
 * @param initialFilters - Initial filter options
 * @returns State and methods for server-side filtering
 *
 * @example
 * const { data, loading, error, filters, setFilters, setPage } = useServerSideFiltering({
 *   search: '',
 *   role: 'CLIENT',
 *   limit: 50
 * })
 */
export function useServerSideFiltering(initialFilters: ServerFilterOptions = {}): UseServerSideFilteringState {
  const [filters, setInternalFilters] = useState<ServerFilterOptions>({
    page: 1,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters
  })

  const [data, setData] = useState<ServerFilterResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Build query string from filters
  const buildQueryString = useCallback((filterParams: ServerFilterOptions) => {
    const params = new URLSearchParams()

    if (filterParams.search) params.append('search', filterParams.search)
    if (filterParams.role && filterParams.role !== 'ALL') params.append('role', filterParams.role)
    if (filterParams.status && filterParams.status !== 'ALL') params.append('status', filterParams.status)
    if (filterParams.department && filterParams.department !== 'ALL') params.append('department', filterParams.department)
    if (filterParams.tier && filterParams.tier !== 'all' && filterParams.tier !== 'ALL') params.append('tier', filterParams.tier)
    if (filterParams.page) params.append('page', String(filterParams.page))
    if (filterParams.limit) params.append('limit', String(filterParams.limit))
    if (filterParams.sortBy) params.append('sortBy', filterParams.sortBy)
    if (filterParams.sortOrder) params.append('sortOrder', filterParams.sortOrder)

    return params.toString()
  }, [])

  // Fetch data from server
  const fetchData = useCallback(async (filterParams: ServerFilterOptions) => {
    setLoading(true)
    setError(null)

    try {
      const queryString = buildQueryString(filterParams)
      const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const result: ServerFilterResponse = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [buildQueryString])

  // Fetch when filters change
  useEffect(() => {
    fetchData(filters)
  }, [filters, fetchData])

  // Methods to update filters
  const setFilters = useCallback((newFilters: ServerFilterOptions) => {
    setInternalFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1 // Reset to page 1 when filters change (unless explicitly set)
    }))
  }, [])

  const setPage = useCallback((page: number) => {
    setInternalFilters((prev) => ({
      ...prev,
      page: Math.max(1, page)
    }))
  }, [])

  const refetch = useCallback(async () => {
    await fetchData(filters)
  }, [filters, fetchData])

  // Calculate pagination info
  const currentPage = data?.pagination.page || 1
  const totalPages = data?.pagination.pages || 0
  const totalCount = data?.pagination.total || 0
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    setPage,
    refetch,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    totalPages,
    totalCount
  }
}
