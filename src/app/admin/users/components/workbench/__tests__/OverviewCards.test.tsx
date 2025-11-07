import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import OverviewCards from '../OverviewCards'

// Setup mocks with hoisted context
const { mockUseUsersContext } = vi.hoisted(() => {
  return {
    mockUseUsersContext: vi.fn()
  }
})

vi.mock('../../../contexts/UsersContextProvider', () => ({
  useUsersContext: mockUseUsersContext
}))

// Mock the OperationsOverviewCards component
vi.mock('../OperationsOverviewCards', () => ({
  OperationsOverviewCards: (props: any) => (
    <div data-testid="operations-overview-cards">
      <div>Total Users: {props.metrics?.totalUsers}</div>
      <div>Pending Approvals: {props.metrics?.pendingApprovals}</div>
      <div>In Progress: {props.metrics?.inProgressWorkflows}</div>
      <div>Due This Week: {props.metrics?.dueThisWeek}</div>
      <div>Loading: {props.isLoading ? 'true' : 'false'}</div>
    </div>
  )
}))

// Mock the Skeleton component
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => <div data-testid="skeleton">Skeleton</div>
}))

describe('OverviewCards', () => {
  beforeEach(() => {
    mockUseUsersContext.mockClear()
    mockUseUsersContext.mockReturnValue({
      users: [],
      isLoading: false,
      error: null
    })
  })

  describe('Loading State', () => {
    it('should show skeleton while loading', () => {
      mockUseUsersContext.mockReturnValue({
        users: [],
        isLoading: true,
        error: null
      })

      render(<OverviewCards />)

      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })

    it('should show metrics when loaded', async () => {
      mockUseUsersContext.mockReturnValue({
        users: [
          { id: '1', status: 'ACTIVE' },
          { id: '2', status: 'INACTIVE' },
          { id: '3', status: 'ACTIVE' }
        ],
        isLoading: false,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByTestId('operations-overview-cards')).toBeInTheDocument()
      })
    })
  })

  describe('Metrics Calculation', () => {
    it('should calculate total users correctly', async () => {
      const users = [
        { id: '1', status: 'ACTIVE' },
        { id: '2', status: 'INACTIVE' },
        { id: '3', status: 'ACTIVE' }
      ]

      mockUseUsersContext.mockReturnValue({
        users,
        isLoading: false,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByText('Total Users: 3')).toBeInTheDocument()
      })
    })

    it('should calculate pending approvals (inactive users)', async () => {
      const users = [
        { id: '1', status: 'ACTIVE' },
        { id: '2', status: 'INACTIVE' },
        { id: '3', status: 'INACTIVE' }
      ]

      mockUseUsersContext.mockReturnValue({
        users,
        isLoading: false,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByText('Pending Approvals: 2')).toBeInTheDocument()
      })
    })

    it('should calculate in progress workflows (active users)', async () => {
      const users = [
        { id: '1', status: 'ACTIVE' },
        { id: '2', status: 'INACTIVE' },
        { id: '3', status: 'ACTIVE' }
      ]

      mockUseUsersContext.mockReturnValue({
        users,
        isLoading: false,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByText('In Progress: 2')).toBeInTheDocument()
      })
    })

    it('should handle empty user list', async () => {
      mockUseUsersContext.mockReturnValue({
        users: [],
        isLoading: false,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByText('Total Users: 0')).toBeInTheDocument()
      })
    })

    it('should handle undefined users array', async () => {
      mockUseUsersContext.mockReturnValue({
        users: undefined,
        isLoading: false,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByText('Total Users: 0')).toBeInTheDocument()
      })
    })
  })

  describe('Rendering', () => {
    it('should render OperationsOverviewCards component', async () => {
      mockUseUsersContext.mockReturnValue({
        users: [{ id: '1', status: 'ACTIVE' }],
        isLoading: false,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByTestId('operations-overview-cards')).toBeInTheDocument()
      })
    })

    it('should pass isLoading prop to OperationsOverviewCards', async () => {
      mockUseUsersContext.mockReturnValue({
        users: [{ id: '1', status: 'ACTIVE' }],
        isLoading: true,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByText('Loading: true')).toBeInTheDocument()
      })
    })

    it('should not show loading state text when not loading', async () => {
      mockUseUsersContext.mockReturnValue({
        users: [{ id: '1', status: 'ACTIVE' }],
        isLoading: false,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByText('Loading: false')).toBeInTheDocument()
      })
    })
  })

  describe('Context Integration', () => {
    it('should read users from context', async () => {
      const contextUsers = [
        { id: '1', status: 'ACTIVE' },
        { id: '2', status: 'ACTIVE' }
      ]

      mockUseUsersContext.mockReturnValue({
        users: contextUsers,
        isLoading: false,
        error: null
      })

      render(<OverviewCards />)

      await waitFor(() => {
        expect(mockUseUsersContext).toHaveBeenCalled()
      })
    })

    it('should update metrics when context changes', async () => {
      const { rerender } = render(<OverviewCards />)

      mockUseUsersContext.mockReturnValue({
        users: [
          { id: '1', status: 'ACTIVE' },
          { id: '2', status: 'ACTIVE' }
        ],
        isLoading: false,
        error: null
      })

      rerender(<OverviewCards />)

      await waitFor(() => {
        expect(screen.getByText('Total Users: 2')).toBeInTheDocument()
      })
    })
  })
})
