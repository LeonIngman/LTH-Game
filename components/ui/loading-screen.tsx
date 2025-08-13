/**
 * LoadingScreen Component - UX1 Implementation
 * 
 * A comprehensive loading screen component that provides visual feedback
 * during loading states with accessibility support and customizable content.
 * 
 * Features:
 * - Accessible loading states with proper ARIA attributes
 * - Customizable messages and descriptions
 * - Overlay and inline modes
 * - Responsive design following Tailwind conventions
 * - Smooth animations and transitions
 */

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingScreenProps {
  /** Loading message to display */
  message?: string
  /** Additional description text */
  description?: string
  /** Whether to render as fullscreen overlay */
  overlay?: boolean
  /** Additional CSS classes */
  className?: string
  /** Size of the loading spinner */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * LoadingScreen component provides visual feedback during loading states
 * 
 * @param message - Custom loading message (default: "Loading...")
 * @param description - Optional description text
 * @param overlay - Render as fullscreen overlay (default: true)
 * @param className - Additional CSS classes
 * @param size - Spinner size (default: "md")
 */
export function LoadingScreen({
  message = 'Loading...',
  description,
  overlay = true,
  className,
  size = 'md'
}: LoadingScreenProps) {
  // Normalize empty or null messages to default
  const displayMessage = message?.trim() || 'Loading...'
  
  // Spinner size classes
  const spinnerSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }
  
  // Container classes based on overlay mode
  const containerClasses = cn(
    // Base layout and styling
    'flex flex-col items-center justify-center space-y-4',
    'bg-background/80 backdrop-blur-sm',
    'min-h-[200px]', // Prevent layout shift
    
    // Overlay mode classes
    overlay && [
      'fixed inset-0 z-50',
      'bg-background/90'
    ],
    
    // Custom classes
    className
  )

  return (
    <div 
      className={containerClasses}
      style={{ minHeight: '200px' }}
    >
      {/* Main loading status container */}
      <div
        role="status"
        aria-live="polite"
        aria-label={`Loading status: ${displayMessage}`}
        className="flex flex-col items-center space-y-4 text-center"
      >
        {/* Loading spinner */}
        <Loader2 
          className={cn(
            'animate-spin text-primary',
            spinnerSizes[size]
          )}
          data-testid="loading-spinner"
          aria-hidden="true"
        />
        
        {/* Loading message */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground text-center">
            {displayMessage}
          </h2>
          
          {/* Optional description */}
          {description && (
            <p className="text-sm text-muted-foreground max-w-md">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * GameLoadingScreen - Specialized loading screen for game states
 * Pre-configured with game-specific styling and messages
 */
export interface GameLoadingScreenProps extends Omit<LoadingScreenProps, 'message'> {
  /** Level being loaded */
  level?: number
  /** Level name */
  levelName?: string
  /** Loading stage */
  stage?: 'initializing' | 'loading-data' | 'preparing-ui' | 'finalizing'
}

export function GameLoadingScreen({
  level,
  levelName,
  stage = 'loading-data',
  description,
  ...props
}: GameLoadingScreenProps) {
  // Generate contextual loading messages
  const getLoadingMessage = () => {
    if (level !== undefined && levelName) {
      return `Loading Level ${level}: ${levelName}`
    }
    if (level !== undefined) {
      return `Loading Level ${level}`
    }
    
    switch (stage) {
      case 'initializing':
        return 'Initializing game...'
      case 'loading-data':
        return 'Loading game data...'
      case 'preparing-ui':
        return 'Preparing game interface...'
      case 'finalizing':
        return 'Finalizing setup...'
      default:
        return 'Loading game...'
    }
  }

  const getLoadingDescription = () => {
    if (description) return description
    
    if (level !== undefined) {
      return 'Preparing your supply chain management experience...'
    }
    
    switch (stage) {
      case 'initializing':
        return 'Setting up your game environment...'
      case 'loading-data':
        return 'Fetching level configuration and data...'
      case 'preparing-ui':
        return 'Building the game interface...'
      case 'finalizing':
        return 'Almost ready to play!'
      default:
        return 'Please wait while we prepare your game...'
    }
  }

  return (
    <LoadingScreen
      message={getLoadingMessage()}
      description={getLoadingDescription()}
      {...props}
    />
  )
}

/**
 * InlineLoadingScreen - Non-overlay loading screen for inline use
 * Perfect for loading states within components
 */
export function InlineLoadingScreen(props: LoadingScreenProps) {
  return (
    <LoadingScreen
      {...props}
      overlay={false}
      className={cn('py-8', props.className)}
    />
  )
}

/**
 * PageLoadingScreen - Full page loading screen
 * Optimized for page-level loading states
 */
export function PageLoadingScreen(props: LoadingScreenProps) {
  return (
    <LoadingScreen
      {...props}
      overlay={true}
      size="lg"
      className={cn('min-h-screen', props.className)}
    />
  )
}
