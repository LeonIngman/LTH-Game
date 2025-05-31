"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

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
  logout: async () => {},
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        cache: "no-store",
      })

      if (!res.ok) {
        console.error("Login API returned error:", res.status, res.statusText)
        return {
          success: false,
          error: `Login failed with status: ${res.status}. Please try again.`,
        }
      }

      let data
      try {
        data = await res.json()
      } catch (jsonError) {
        console.error("Error parsing login response:", jsonError)
        return { success: false, error: "Invalid response from server" }
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
        return { success: false, error: data?.error || "Invalid credentials" }
      }
    } catch (fetchError) {
      console.error("Error fetching login:", fetchError)
      return { success: false, error: "Network error. Please try again." }
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
