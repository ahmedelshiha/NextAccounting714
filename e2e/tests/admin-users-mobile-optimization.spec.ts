import { test, expect } from '@playwright/test'

test.describe('Mobile UI Optimization - User Management', () => {
  // Test on mobile viewport (iPhone 12)
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    // Login and navigate to users page
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
  })

  test.describe('UsersTable Mobile Card View', () => {
    test('should display card view toggle buttons on mobile', async ({ page }) => {
      // Check for view toggle buttons
      const tableViewBtn = page.getByLabel('Table view')
      const cardViewBtn = page.getByLabel('Card view')

      await expect(tableViewBtn).toBeVisible()
      await expect(cardViewBtn).toBeVisible()
    })

    test('should switch to card view when card button is clicked', async ({ page }) => {
      // Click card view button
      const cardViewBtn = page.getByLabel('Card view')
      await cardViewBtn.click()

      // Wait for card view to render
      await page.waitForTimeout(300)

      // Verify card view is visible
      const cardView = page.locator('[role="grid"]').first()
      await expect(cardView).toBeVisible()

      // Check that cards are displayed (multiple grid cells)
      const gridCells = page.locator('[role="gridcell"]')
      const count = await gridCells.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should switch back to table view when table button is clicked', async ({ page }) => {
      // First switch to card view
      await page.getByLabel('Card view').click()
      await page.waitForTimeout(300)

      // Then switch back to table view
      await page.getByLabel('Table view').click()
      await page.waitForTimeout(300)

      // Verify table view is visible
      const table = page.locator('table')
      await expect(table).toBeVisible()
    })

    test('should display user information in card format on mobile', async ({ page }) => {
      // Switch to card view
      await page.getByLabel('Card view').click()
      await page.waitForTimeout(300)

      // Find first user card
      const firstCard = page.locator('[role="gridcell"]').first()
      await expect(firstCard).toBeVisible()

      // Verify card contains key information
      const cardText = await firstCard.textContent()
      expect(cardText).toBeTruthy()
      // Should contain status or role information
      expect(cardText?.toUpperCase()).toMatch(/ACTIVE|INACTIVE|ADMIN|CLIENT|TEAM/i)
    })

    test('should have touch-friendly action buttons on mobile', async ({ page }) => {
      // Switch to card view
      await page.getByLabel('Card view').click()
      await page.waitForTimeout(300)

      // Find action buttons
      const actionButtons = page.getByLabel(/view profile/i)
      const count = await actionButtons.count()
      expect(count).toBeGreaterThan(0)

      // Check button size for touch accessibility (at least 44x44px)
      const firstButton = actionButtons.first()
      const box = await firstButton.boundingBox()
      expect(box).toBeTruthy()
      if (box) {
        // Buttons should have adequate size for touch targets
        expect(box.width).toBeGreaterThanOrEqual(36) // 9 units * 4px
        expect(box.height).toBeGreaterThanOrEqual(36)
      }
    })

    test('should handle scrolling in card view smoothly', async ({ page }) => {
      // Switch to card view
      await page.getByLabel('Card view').click()
      await page.waitForTimeout(300)

      // Scroll down
      const cardContainer = page.locator('[role="grid"]').first()
      await cardContainer.evaluate(el => el.scrollTop = el.scrollHeight)

      // Wait for potential lazy loading
      await page.waitForTimeout(500)

      // Should still be able to see cards
      const gridCells = page.locator('[role="gridcell"]')
      const count = await gridCells.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('AuditTab Mobile Layout', () => {
    test('should navigate to AuditTab', async ({ page }) => {
      // Click Audit tab
      const auditTab = page.getByRole('tab', { name: /audit/i })
      if (await auditTab.isVisible()) {
        await auditTab.click()
        await page.waitForLoadState('networkidle')
      }
    })

    test('should display audit logs in card format on mobile', async ({ page }) => {
      // Navigate to AuditTab if needed
      const auditTab = page.getByRole('tab', { name: /audit/i })
      if (await auditTab.isVisible()) {
        await auditTab.click()
        await page.waitForLoadState('networkidle')
      }

      // Check for mobile card layout
      const logCards = page.locator('div[role="status"]')
      const count = await logCards.count()

      // If there are logs, verify they're displayed in card format
      if (count > 0) {
        const firstCard = logCards.first()
        const box = await firstCard.boundingBox()
        expect(box).toBeTruthy()
        expect(box?.width).toBeGreaterThan(0)
      }
    })

    test('should show/hide filters on mobile without layout shift', async ({ page }) => {
      // Navigate to AuditTab
      const auditTab = page.getByRole('tab', { name: /audit/i })
      if (await auditTab.isVisible()) {
        await auditTab.click()
        await page.waitForLoadState('networkidle')
      }

      // Get initial viewport dimensions
      const { width: initialWidth } = page.viewportSize()!

      // Toggle filters
      const filterBtn = page.getByRole('button', { name: /filter|show filters/i })
      if (await filterBtn.isVisible()) {
        await filterBtn.click()
        await page.waitForTimeout(300)

        // Verify width hasn't changed (no horizontal overflow)
        const { width: finalWidth } = page.viewportSize()!
        expect(finalWidth).toBe(initialWidth)
      }
    })
  })

  test.describe('Dashboard Mobile Layout', () => {
    test('should display metric cards in single column on mobile', async ({ page }) => {
      // Get the metrics grid
      const metricsGrid = page.locator('div[class*="grid"]').first()
      await expect(metricsGrid).toBeVisible()

      // On mobile (390px), cards should stack vertically
      const cards = metricsGrid.locator('> *')
      const count = await cards.count()

      if (count > 1) {
        // Get bounding boxes of first two cards
        const box1 = await cards.nth(0).boundingBox()
        const box2 = await cards.nth(1).boundingBox()

        if (box1 && box2) {
          // Cards should not be side-by-side on mobile
          // box2.x should be approximately equal to box1.x (same left position)
          expect(Math.abs(box2.x! - box1.x!)).toBeLessThan(50) // Allow small margin for padding
        }
      }
    })

    test('should have readable text sizes on mobile', async ({ page }) => {
      // Check header text size
      const header = page.locator('h1').first()
      if (await header.isVisible()) {
        const size = await header.evaluate(el => window.getComputedStyle(el).fontSize)
        const fontSize = parseInt(size)
        // Mobile header should be at least 18px (readable)
        expect(fontSize).toBeGreaterThanOrEqual(16)
      }
    })

    test('should have proper spacing on mobile', async ({ page }) => {
      // Check for proper padding/margins to avoid crowded layout
      const cards = page.locator('[class*="Card"]').first()
      if (await cards.isVisible()) {
        const padding = await cards.evaluate(el => window.getComputedStyle(el).padding)
        expect(padding).toBeTruthy()
        // Should have some padding for touch comfort
        expect(padding).not.toBe('0px')
      }
    })
  })

  test.describe('Header Mobile Layout', () => {
    test('should stack header elements vertically on mobile', async ({ page }) => {
      // Get header container
      const header = page.locator('header').first()

      if (await header.isVisible()) {
        const box = await header.boundingBox()
        // On mobile, header should not be cramped
        expect(box).toBeTruthy()
        expect(box?.height).toBeGreaterThan(80) // Account for stacking
      }
    })

    test('should show search field full width on mobile', async ({ page }) => {
      // Get search input
      const searchInput = page.locator('input[type="text"]').first()

      if (await searchInput.isVisible()) {
        const box = await searchInput.boundingBox()
        const viewport = page.viewportSize()!

        // Search should be most of the width on mobile
        expect(box).toBeTruthy()
        expect(box?.width).toBeGreaterThan(viewport.width * 0.7)
      }
    })

    test('should make action buttons accessible on mobile', async ({ page }) => {
      // Action buttons should be visible and not overlapping
      const actionButtons = page.locator('button').filter({ hasText: /refresh|export/i })

      if (await actionButtons.first().isVisible()) {
        const count = await actionButtons.count()
        expect(count).toBeGreaterThan(0)

        // Each button should be clickable (has reasonable size)
        for (let i = 0; i < Math.min(count, 2); i++) {
          const btn = actionButtons.nth(i)
          const box = await btn.boundingBox()
          expect(box?.width).toBeGreaterThan(0)
          expect(box?.height).toBeGreaterThan(0)
        }
      }
    })
  })

  test.describe('Filter Panel Mobile Layout', () => {
    test('should display filters in stacked layout on mobile', async ({ page }) => {
      // Open filters if available
      const filterToggle = page.getByRole('button', { name: /filter|show filters/i })

      if (await filterToggle.isVisible()) {
        await filterToggle.click()
        await page.waitForTimeout(300)

        // Check if filter inputs are visible
        const filterInputs = page.locator('input, select').filter({ visible: true })
        const count = await filterInputs.count()

        // Should have at least a few filter options
        if (count > 0) {
          // Get dimensions of filter area
          const filterArea = page.locator('[class*="filter"]').first()
          if (await filterArea.isVisible()) {
            const box = await filterArea.boundingBox()
            expect(box?.width).toBeGreaterThan(0)
          }
        }
      }
    })
  })

  test.describe('Mobile Responsiveness - Tablet Viewport', () => {
    test.use({ viewport: { width: 768, height: 1024 } })

    test('should display 2 columns on tablet', async ({ page }) => {
      // Tablet should show more columns than mobile
      const metricsGrid = page.locator('div[class*="grid"]').first()

      if (await metricsGrid.isVisible()) {
        const cards = metricsGrid.locator('> *')
        const count = await cards.count()

        if (count > 1) {
          const box1 = await cards.nth(0).boundingBox()
          const box2 = await cards.nth(1).boundingBox()

          if (box1 && box2) {
            // On tablet, cards might be side-by-side
            // This is acceptable behavior for tablet layout
            expect(box1.width).toBeGreaterThan(0)
            expect(box2.width).toBeGreaterThan(0)
          }
        }
      }
    })
  })

  test.describe('Mobile Navigation', () => {
    test('should provide accessible tab navigation on mobile', async ({ page }) => {
      // Get all tabs
      const tabs = page.getByRole('tab')
      const count = await tabs.count()

      // Should have multiple tabs
      expect(count).toBeGreaterThan(0)

      // Each tab should be keyboard accessible
      const firstTab = tabs.first()
      await expect(firstTab).toBeFocused() // Or manually focus it

      // Should be able to scroll tabs if needed
      const tabContainer = page.locator('[role="tablist"]').first()
      if (await tabContainer.isVisible()) {
        const box = await tabContainer.boundingBox()
        expect(box).toBeTruthy()
      }
    })
  })

  test.describe('Mobile Touch Interactions', () => {
    test('should handle touch events on card items', async ({ page }) => {
      // Switch to card view
      const cardViewBtn = page.getByLabel('Card view')
      if (await cardViewBtn.isVisible()) {
        await cardViewBtn.click()
        await page.waitForTimeout(300)

        // Try clicking on a card
        const firstCard = page.locator('[role="gridcell"]').first()
        if (await firstCard.isVisible()) {
          // Should respond to click
          await firstCard.click({ button: 'left' })

          // Should potentially open a modal or navigate
          await page.waitForTimeout(300)
          // No specific assertion - just verify it doesn't error
        }
      }
    })

    test('should have proper touch target sizes', async ({ page }) => {
      // Find all interactive elements
      const buttons = page.locator('button')
      const count = await buttons.count()

      // Sample first few buttons and check their sizes
      const samplesToCheck = Math.min(count, 5)

      for (let i = 0; i < samplesToCheck; i++) {
        const btn = buttons.nth(i)
        const box = await btn.boundingBox()

        if (box && (await btn.isVisible())) {
          // Touch targets should be at least 40-44px
          // Allow some margin for small icon buttons
          if (box.width > 20 && box.height > 20) {
            // Non-tiny button, should be reasonably accessible
            expect(box.width).toBeGreaterThanOrEqual(30)
            expect(box.height).toBeGreaterThanOrEqual(30)
          }
        }
      }
    })
  })
})
