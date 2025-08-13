"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AuthErrorType, mapErrorToUserMessage, logAuthError } from "./auth-utils"

// Define the User type
type User = {
  id: string
  username: string
  role: string
  progress: number
}

// Define the AuthContext type
type AuthContextType = {
  user: User | null
  loading: boolean
  login: (
    username: string,
    password: string,
  ) => Promise<{
    success: boolean
    error?: string
    errorType?: AuthErrorType
    role?: string
    username?: string
    id?: string
  }>
  logout: () => Promise<void>
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => { },
})

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const router = useRouter()

  // Check if the user is logged in on mount
  useEffect(() => {
    if (authChecked) return

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })

        if (!res.ok) {
          console.error("Session API returned error:", res.status, res.statusText)
          setUser(null)
          return
        }

        try {
          const data = await res.json()
          if (data && data.user) {
            setUser(data.user)
          } else {
            setUser(null)
          }
        } catch (jsonError) {
          console.error("Error parsing session response:", jsonError)
          setUser(null)
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        setUser(null)
      } finally {
        setLoading(false)
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [authChecked])

  // Login function - use useCallback to prevent recreation on every render
  const login = useCallback(async (username: string, password: string) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        cache: "no-store",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      let data
      try {
        data = await res.json()
      } catch (jsonError) {
        logAuthError(jsonError, 'JSON Parsing')
        const errorMapping = mapErrorToUserMessage({
          message: 'Invalid response from server',
          type: 'NETWORK_ERROR'
        })
        return {
          success: false,
          error: errorMapping.message,
          errorType: errorMapping.type
        }
      }

      if (!res.ok) {
        logAuthError({ status: res.status, message: data?.error }, 'HTTP Error')
        const errorMapping = mapErrorToUserMessage({
          status: res.status,
          message: data?.error || `HTTP ${res.status}`
        })
        return {
          success: false,
          error: errorMapping.message,
          errorType: errorMapping.type
        }
      }

      if (data && data.user) {
        setUser(data.user)
        return {
          success: true,
          role: data.user.role,
          username: data.user.username,
          id: data.user.id,
        }
      } else {
        logAuthError({ message: data?.error || 'No user data received' }, 'Auth Response')
        const errorMapping = mapErrorToUserMessage({
          status: 401,
          message: data?.error || 'Invalid credentials'
        })
        return {
          success: false,
          error: errorMapping.message,
          errorType: errorMapping.type
        }
      }
    } catch (fetchError: any) {
      logAuthError(fetchError, 'Network Request')

      // Handle timeout specifically
      if (fetchError.name === 'AbortError') {
        return {
          success: false,
          error: 'Network issue — check your connection and try again',
          errorType: AuthErrorType.TIMEOUT_ERROR
        }
      }

      const errorMapping = mapErrorToUserMessage(fetchError)
      return {
        success: false,
        error: errorMapping.message,
        errorType: errorMapping.type
      }
    }
  }, [])

  // Logout function - use useCallback to prevent recreation on every render
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      })
    } catch (fetchError) {
      console.error("Error fetching logout:", fetchError)
    }
    setUser(null)
    router.push("/")
  }, [router])

  // Debugging: Log the AuthContext values
  console.log("AuthContext: user", user, "loading", loading)

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
