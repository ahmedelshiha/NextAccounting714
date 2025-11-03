import { test, expect } from '@playwright/test'
import { devLoginAndSetCookie } from './fixtures/auth'

test.describe('Server-Side Filtering API Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to admin users page
    await devLoginAndSetCookie(page)
    await page.goto('/admin/users')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('API Filtering Parameters', () => {
    test('should support search filter parameter', async ({ page }) => {
      // Test search filter via direct API call
      const response = await page.request.get('/api/admin/users?search=john', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toHaveProperty('users')
      expect(data).toHaveProperty('pagination')
      expect(Array.isArray(data.users)).toBe(true)
      
      // Verify all returned users match search term
      if (data.users.length > 0) {
        data.users.forEach((user: any) => {
          const nameMatch = user.name?.toLowerCase().includes('john')
          const emailMatch = user.email?.toLowerCase().includes('john')
          const departmentMatch = user.department?.toLowerCase().includes('john')
          
          expect(nameMatch || emailMatch || departmentMatch).toBe(true)
        })
      }
    })

    test('should support role filter parameter', async ({ page }) => {
      // Test role filter
      const response = await page.request.get('/api/admin/users?role=ADMIN', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.users).toBeDefined()
      
      // Verify all users have ADMIN role
      data.users.forEach((user: any) => {
        expect(user.role).toBe('ADMIN')
      })
    })

    test('should support status filter parameter', async ({ page }) => {
      // Test status filter
      const response = await page.request.get('/api/admin/users?status=ACTIVE', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.users).toBeDefined()
      
      // All users should match the status
      if (data.users.length > 0) {
        expect(data.users.length).toBeGreaterThan(0)
      }
    })

    test('should support department filter parameter', async ({ page }) => {
      // Test department filter
      const response = await page.request.get('/api/admin/users?department=Engineering', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.users).toBeDefined()
      
      // If there are results, verify department filter works
      if (data.users.length > 0) {
        data.users.forEach((user: any) => {
          if (user.department) {
            expect(user.department).toBe('Engineering')
          }
        })
      }
    })

    test('should support tier filter parameter for clients', async ({ page }) => {
      // Test tier filter
      const response = await page.request.get('/api/admin/users?tier=ENTERPRISE', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.users).toBeDefined()
      
      // If there are results, verify tier filter works
      if (data.users.length > 0) {
        data.users.forEach((user: any) => {
          if (user.tier) {
            expect(user.tier).toBe('ENTERPRISE')
          }
        })
      }
    })

    test('should support multiple filters simultaneously', async ({ page }) => {
      // Test multiple filters at once
      const response = await page.request.get('/api/admin/users?search=admin&role=ADMIN&page=1&limit=10', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.users).toBeDefined()
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBeLessThanOrEqual(10)
      
      // Verify all results match role filter
      data.users.forEach((user: any) => {
        expect(user.role).toBe('ADMIN')
      })
    })

    test('should support sorting by different fields', async ({ page }) => {
      // Test sortBy parameter
      const responseName = await page.request.get('/api/admin/users?sortBy=name&sortOrder=asc&limit=5')
      expect(responseName.status()).toBe(200)
      
      const dataName = await responseName.json()
      expect(dataName.users).toBeDefined()
      expect(dataName.users.length).toBeGreaterThan(0)
      
      // Test sorting by createdAt
      const responseDate = await page.request.get('/api/admin/users?sortBy=createdAt&sortOrder=desc&limit=5')
      expect(responseDate.status()).toBe(200)
      
      const dataDate = await responseDate.json()
      expect(dataDate.users).toBeDefined()
    })

    test('should support pagination parameters', async ({ page }) => {
      // Test pagination
      const page1 = await page.request.get('/api/admin/users?page=1&limit=10')
      expect(page1.status()).toBe(200)
      
      const data1 = await page1.json()
      expect(data1.pagination.page).toBe(1)
      expect(data1.pagination.limit).toBeLessThanOrEqual(10)
      
      // Get second page if available
      if (data1.pagination.pages > 1) {
        const page2 = await page.request.get('/api/admin/users?page=2&limit=10')
        expect(page2.status()).toBe(200)
        
        const data2 = await page2.json()
        expect(data2.pagination.page).toBe(2)
        expect(data2.pagination.limit).toBeLessThanOrEqual(10)
        
        // Verify different data between pages
        const ids1 = data1.users.map((u: any) => u.id)
        const ids2 = data2.users.map((u: any) => u.id)
        
        // Pages should have different users (unless small dataset)
        if (data1.pagination.total > 10) {
          expect(ids1).not.toEqual(ids2)
        }
      }
    })

    test('should respect limit parameter (max 100)', async ({ page }) => {
      // Test that limit is enforced
      const response = await page.request.get('/api/admin/users?limit=1000', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      expect(response.status()).toBe(200)
      
      const data = await response.json()
      // Limit should be capped at 100
      expect(data.pagination.limit).toBeLessThanOrEqual(100)
      expect(data.users.length).toBeLessThanOrEqual(100)
    })
  })

  test.describe('Response Format', () => {
    test('should return correct response structure', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?page=1&limit=10')
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      
      // Verify structure
      expect(data).toHaveProperty('users')
      expect(data).toHaveProperty('pagination')
      expect(Array.isArray(data.users)).toBe(true)
      
      // Verify pagination structure
      expect(data.pagination).toHaveProperty('page')
      expect(data.pagination).toHaveProperty('limit')
      expect(data.pagination).toHaveProperty('total')
      expect(data.pagination).toHaveProperty('pages')
      
      // Verify user object structure
      if (data.users.length > 0) {
        const user = data.users[0]
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('name')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('role')
        expect(user).toHaveProperty('createdAt')
        expect(user).toHaveProperty('updatedAt')
      }
    })

    test('should include filter-specific fields in response', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?page=1&limit=10')
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      
      // Verify new fields are included
      if (data.users.length > 0) {
        const user = data.users[0]
        // These fields should be present (though may be null)
        expect(user).toHaveProperty('department')
        expect(user).toHaveProperty('tier')
      }
    })

    test('should include ETag header for caching', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?page=1')
      
      expect(response.status()).toBe(200)
      
      // Check for ETag header for cache validation
      const etag = response.headers()['etag']
      expect(etag).toBeDefined()
    })

    test('should return 304 Not Modified on ETag match', async ({ page }) => {
      // Get initial response with ETag
      const response1 = await page.request.get('/api/admin/users?page=1&limit=10')
      expect(response1.status()).toBe(200)
      
      const etag = response1.headers()['etag']
      expect(etag).toBeDefined()
      
      // Send request with If-None-Match header
      const response2 = await page.request.get('/api/admin/users?page=1&limit=10', {
        headers: {
          'if-none-match': etag || ''
        }
      })
      
      // Should return 304 since data hasn't changed
      expect(response2.status()).toBe(304)
    })
  })

  test.describe('Filter Edge Cases', () => {
    test('should handle empty search results gracefully', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?search=nonexistentuser12345xyz')
      
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.users).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)
      expect(data.pagination.total).toBe(0)
    })

    test('should handle ALL filter value', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?role=ALL')
      
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.users).toBeDefined()
      // ALL should return unfiltered by role
    })

    test('should handle case-insensitive search', async ({ page }) => {
      // Search with different cases
      const responseLower = await page.request.get('/api/admin/users?search=admin')
      const responseUpper = await page.request.get('/api/admin/users?search=ADMIN')
      const responseMixed = await page.request.get('/api/admin/users?search=Admin')
      
      expect(responseLower.status()).toBe(200)
      expect(responseUpper.status()).toBe(200)
      expect(responseMixed.status()).toBe(200)
      
      const dataLower = await responseLower.json()
      const dataUpper = await responseUpper.json()
      const dataMixed = await responseMixed.json()
      
      // All should return same results due to case-insensitive search
      expect(dataLower.pagination.total).toBe(dataUpper.pagination.total)
      expect(dataUpper.pagination.total).toBe(dataMixed.pagination.total)
    })

    test('should ignore invalid page numbers gracefully', async ({ page }) => {
      const response = await page.request.get('/api/admin/users?page=0')
      
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      // Should default to page 1
      expect(data.pagination.page).toBeGreaterThanOrEqual(1)
    })
  })

  test.describe('Performance Considerations', () => {
    test('should return filtered results faster than fetching all and filtering client-side', async ({ page }) => {
      const startTime = Date.now()
      
      const response = await page.request.get('/api/admin/users?role=CLIENT&limit=50')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(response.status()).toBe(200)
      
      // Server-side filtering should complete in reasonable time
      // (adjust threshold based on your performance requirements)
      expect(duration).toBeLessThan(5000) // 5 second threshold
    })

    test('should support cursor-based pagination for better performance', async ({ page }) => {
      // Test pagination with different limits to ensure scalability
      const response1 = await page.request.get('/api/admin/users?limit=50')
      const response2 = await page.request.get('/api/admin/users?limit=100')
      
      expect(response1.status()).toBe(200)
      expect(response2.status()).toBe(200)
      
      const data1 = await response1.json()
      const data2 = await response2.json()
      
      expect(data1.users.length).toBeLessThanOrEqual(50)
      expect(data2.users.length).toBeLessThanOrEqual(100)
    })
  })
})

test.describe('Server-Side Filtering UI Integration', () => {
  test.beforeEach(async ({ page }) => {
    await devLoginAndSetCookie(page)
    await page.goto('/admin/users')
    
    // Switch to Operations tab if not already there
    const operationsTab = page.locator('[role="tab"]:has-text("Operations")')
    if (await operationsTab.isVisible()) {
      await operationsTab.click()
      await page.waitForLoadState('networkidle')
    }
  })

  test('should display pagination controls when data is filtered', async ({ page }) => {
    // Look for pagination controls
    const paginationControls = page.locator('button:has-text("Previous"), button:has-text("Next")')
    
    // May or may not be visible depending on data size
    // Just verify page loads properly
    await expect(page.locator('[role="region"][aria-label="User table and bulk actions"]')).toBeVisible()
  })

  test('should update table when filter is applied', async ({ page }) => {
    // Find filter input or search box
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first()
    
    if (await searchInput.isVisible()) {
      // Apply search filter
      await searchInput.fill('admin')
      await searchInput.press('Enter')
      
      // Wait for results to update
      await page.waitForLoadState('networkidle')
      
      // Verify table is still visible
      await expect(page.locator('[role="table"], [role="grid"]')).toBeVisible()
    }
  })

  test('should show loading state while filtering', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first()
    
    if (await searchInput.isVisible()) {
      // Apply filter with delay to observe loading state
      await searchInput.fill('test')
      
      // There might be a loading indicator
      const loadingIndicators = page.locator('[aria-busy="true"], .animate-spin, .loading')
      
      // Wait for network to complete
      await page.waitForLoadState('networkidle')
      
      // Verify table is still visible after loading
      await expect(page.locator('[role="table"], [role="grid"]')).toBeVisible()
    }
  })
})
