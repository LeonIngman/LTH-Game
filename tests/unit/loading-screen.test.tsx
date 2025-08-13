/**
 * Unit Tests for LoadingScreen Component - UX1 Implementation
 * Testing loading screen display, accessibility, and user experience
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Component will be created next
import { LoadingScreen } from '@/components/ui/loading-screen'

describe('LoadingScreen Component - UX1', () => {
  describe('Basic Rendering', () => {
    it('should render loading screen with default message', () => {
      render(<LoadingScreen />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render with custom message', () => {
      const customMessage = 'Loading game data...'
      render(<LoadingScreen message={customMessage} />)
      
      expect(screen.getByText(customMessage)).toBeInTheDocument()
    })

    it('should render with custom description', () => {
      const description = 'Please wait while we prepare your game experience'
      render(<LoadingScreen description={description} />)
      
      expect(screen.getByText(description)).toBeInTheDocument()
    })
  })

  describe('Loading Animation', () => {
    it('should display spinning loader icon', () => {
      render(<LoadingScreen />)
      
      // Check for spinning animation class
      const loader = screen.getByTestId('loading-spinner')
      expect(loader).toBeInTheDocument()
      expect(loader).toHaveClass('animate-spin')
    })

    it('should have proper aria attributes for screen readers', () => {
      render(<LoadingScreen />)
      
      const statusElement = screen.getByRole('status')
      expect(statusElement).toHaveAttribute('aria-live', 'polite')
      expect(statusElement).toHaveAttribute('aria-label', expect.stringContaining('Loading'))
    })
  })

  describe('Accessibility', () => {
    it('should be accessible to screen readers', () => {
      render(<LoadingScreen message="Loading game..." />)
      
      // Should have proper ARIA role
      const statusElement = screen.getByRole('status')
      expect(statusElement).toBeInTheDocument()
      
      // Should have accessible text
      expect(screen.getByText('Loading game...')).toBeInTheDocument()
    })

    it('should have proper focus management', () => {
      render(<LoadingScreen />)
      
      // Loading screen should not steal focus but should be announced
      const statusElement = screen.getByRole('status')
      expect(statusElement).not.toHaveFocus()
    })

    it('should provide meaningful status updates', () => {
      const { rerender } = render(<LoadingScreen message="Initializing..." />)
      expect(screen.getByText('Initializing...')).toBeInTheDocument()
      
      rerender(<LoadingScreen message="Loading game data..." />)
      expect(screen.getByText('Loading game data...')).toBeInTheDocument()
    })
  })

  describe('Visual Design', () => {
    it('should apply correct styling classes', () => {
      render(<LoadingScreen />)
      
      const container = screen.getByRole('status').parentElement
      expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
    })

    it('should support custom className', () => {
      render(<LoadingScreen className="custom-loading-class" />)
      
      const container = screen.getByRole('status').parentElement
      expect(container).toHaveClass('custom-loading-class')
    })

    it('should have proper spacing between elements', () => {
      render(<LoadingScreen message="Loading..." description="Please wait" />)
      
      const container = screen.getByRole('status').parentElement
      expect(container).toHaveClass('space-y-4')
    })
  })

  describe('Loading States', () => {
    it('should support fullscreen overlay mode', () => {
      render(<LoadingScreen overlay />)
      
      const container = screen.getByRole('status').parentElement
      expect(container).toHaveClass('fixed', 'inset-0', 'z-50')
    })

    it('should support inline loading mode', () => {
      render(<LoadingScreen overlay={false} />)
      
      const container = screen.getByRole('status').parentElement
      expect(container).not.toHaveClass('fixed', 'inset-0')
    })

    it('should handle loading completion', () => {
      const { rerender } = render(<LoadingScreen />)
      expect(screen.getByRole('status')).toBeInTheDocument()
      
      // Simulate loading complete by not rendering component
      rerender(<div>Content loaded</div>)
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.getByText('Content loaded')).toBeInTheDocument()
    })
  })

  describe('Performance and UX', () => {
    it('should render quickly for immediate feedback', () => {
      const startTime = performance.now()
      render(<LoadingScreen />)
      const endTime = performance.now()
      
      // Should render in less than 16ms (60fps)
      expect(endTime - startTime).toBeLessThan(16)
    })

    it('should not cause layout shift', () => {
      const { container } = render(<LoadingScreen />)
      
      // Should have fixed dimensions to prevent layout shift
      const loadingContainer = container.firstChild as HTMLElement
      expect(loadingContainer).toHaveStyle({ minHeight: '200px' })
    })

    it('should provide visual feedback immediately', () => {
      render(<LoadingScreen />)
      
      // Spinner should be visible immediately
      expect(screen.getByTestId('loading-spinner')).toBeVisible()
      expect(screen.getByText('Loading...')).toBeVisible()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long messages gracefully', () => {
      const longMessage = 'A'.repeat(200)
      render(<LoadingScreen message={longMessage} />)
      
      expect(screen.getByText(longMessage)).toBeInTheDocument()
      // Text should wrap properly
      const messageElement = screen.getByText(longMessage)
      expect(messageElement).toHaveClass('text-center')
    })

    it('should handle empty message', () => {
      render(<LoadingScreen message="" />)
      
      // Should fall back to default
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should handle null or undefined props gracefully', () => {
      render(<LoadingScreen message={undefined as any} />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})

describe('LoadingScreen Integration', () => {
  describe('Game Loading Integration', () => {
    it('should integrate with game loading states', async () => {
      // This will test integration with the actual game loading
      const mockGameProps = {
        message: 'Loading Level 1: The First Spark',
        description: 'Preparing your supply chain management experience...'
      }
      
      render(<LoadingScreen {...mockGameProps} />)
      
      expect(screen.getByText('Loading Level 1: The First Spark')).toBeInTheDocument()
      expect(screen.getByText('Preparing your supply chain management experience...')).toBeInTheDocument()
    })

    it('should work with Suspense boundaries', () => {
      // Test that it works as expected fallback
      const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
        <React.Suspense fallback={<LoadingScreen message="Loading component..." />}>
          {children}
        </React.Suspense>
      )
      
      const LazyComponent = React.lazy(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({ default: () => <div>Loaded!</div> })
          }, 10)
        }) as Promise<{ default: React.ComponentType }>
      )
      
      render(
        <SuspenseWrapper>
          <LazyComponent />
        </SuspenseWrapper>
      )
      
      // Should show loading screen initially
      expect(screen.getByText('Loading component...')).toBeInTheDocument()
    })
  })
})
