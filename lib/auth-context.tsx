"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

import { isV0Preview } from "./v0-detection"

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
  const [authChecked, setAuthChecked] = useState(false) // Add this to prevent multiple checks
  const router = useRouter()

  // Check if the user is logged in on mount
  useEffect(() => {
    // Only check auth once
    if (authChecked) return

    const checkAuth = async () => {
      try {
        // If in v0 preview, use demo user
        if (isV0Preview()) {
          console.log("Using v0 preview demo user")
          // Check localStorage for role preference
          let role = "student"

          try {
            const storedRole = localStorage.getItem("demoUserRole")
            if (storedRole === "teacher" || storedRole === "student") {
              role = storedRole
            }
          } catch (e) {
            console.error("Error accessing localStorage:", e)
          }

          if (role === "teacher") {
            setUser({
              id: "demo-teacher-1",
              username: "teacher",
              role: "teacher",
              progress: 3,
            })
          } else {
            setUser({
              id: "demo-student-1",
              username: "student",
              role: "student",
              progress: 0,
            })
          }

          setLoading(false)
          setAuthChecked(true)
          return
        }

        // Otherwise, fetch the session with error handling
        try {
          const res = await fetch("/api/auth/session", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            // Add cache: 'no-store' to prevent caching issues
            cache: "no-store",
          })

          // Check if response is ok before trying to parse JSON
          if (!res.ok) {
            console.error("Session API returned error:", res.status, res.statusText)
            setUser(null)
            setLoading(false)
            setAuthChecked(true)
            return
          }

          // Try to parse the response as JSON
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
        } catch (fetchError) {
          console.error("Error fetching session:", fetchError)
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
  }, [authChecked]) // Only depend on authChecked

  // Login function - use useCallback to prevent recreation on every render
  const login = useCallback(async (username: string, password: string) => {
    try {
      // If in v0 preview, use demo login
      if (isV0Preview()) {
        console.log("Using v0 preview login")

        // Determine role based on username
        const isTeacher = username.includes("teacher")
        const role = isTeacher ? "teacher" : "student"
        const userId = isTeacher ? "demo-teacher-1" : "demo-student-1"

        // Store role preference in localStorage
        try {
          localStorage.setItem("demoUserRole", role)
        } catch (e) {
          console.error("Error setting localStorage:", e)
        }

        // Set demo user
        if (isTeacher) {
          setUser({
            id: userId,
            username: "teacher",
            role: "teacher",
            progress: 3,
          })
        } else {
          setUser({
            id: userId,
            username: username.startsWith("Group-") ? username : "student",
            role: "student",
            progress: 0,
          })
        }

        return {
          success: true,
          role,
          username: username.startsWith("Group-") ? username : isTeacher ? "teacher" : "student",
          id: userId,
        }
      }

      // Otherwise, use the API with error handling
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
          cache: "no-store",
        })

        // Check if response is ok before trying to parse JSON
        if (!res.ok) {
          console.error("Login API returned error:", res.status, res.statusText)
          return {
            success: false,
            error: `Login failed with status: ${res.status}. Please try again.`,
          }
        }

        // Try to parse the response as JSON
        try {
          const data = await res.json()
          if (data && data.user) {
            setUser(data.user)
            return {
              success: true,
              role: data.user.role,
              username: data.user.username,
              id: data.user.id,
            }
          } else {
            return { success: false, error: data.error || "Invalid credentials" }
          }
        } catch (jsonError) {
          console.error("Error parsing login response:", jsonError)
          return { success: false, error: "Invalid response from server" }
        }
      } catch (fetchError) {
        console.error("Error fetching login:", fetchError)
        return { success: false, error: "Network error. Please try again." }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      return { success: false, error: error.message || "Something went wrong" }
    }
  }, []) // No dependencies

  // Logout function - use useCallback to prevent recreation on every render
  const logout = useCallback(async () => {
    try {
      // If in v0 preview, just clear the user
      if (isV0Preview()) {
        setUser(null)
        try {
          localStorage.removeItem("demoUserRole")
        } catch (e) {
          console.error("Error removing from localStorage:", e)
        }
        router.push("/")
        return
      }

      // Otherwise, use the API with error handling
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          cache: "no-store",
        })
      } catch (fetchError) {
        console.error("Error fetching logout:", fetchError)
      }

      // Always clear the user state, even if the API call fails
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Always clear the user state, even if there's an error
      setUser(null)
      router.push("/")
    }
  }, [router]) // Only depend on router

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
