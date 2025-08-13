"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { AuthErrorType, logAuthError } from "@/lib/auth-utils"

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{
    message: string
    type: AuthErrorType | null
  } | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const { login } = useAuth()

  const clearError = () => {
    setError(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    clearError()

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError({
        message: "Please enter both username and password",
        type: AuthErrorType.VALIDATION_ERROR
      })
      errorRef.current?.focus()
      return
    }

    try {
      setIsLoading(true)

      // Call login with improved error handling
      const result = await login(formData.username, formData.password)

      if (result.success) {
        // Determine redirect path
        const redirectPath = searchParams.get("callbackUrl") ||
          (result.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student")

        // Clear any existing errors
        clearError()

        // Navigate to dashboard
        router.replace(redirectPath)
      } else {
        // Set accessible error message
        setError({
          message: result.error || "An unexpected error occurred. Please try again",
          type: result.errorType || AuthErrorType.SERVER_ERROR
        })

        // Focus error container for screen readers
        setTimeout(() => {
          errorRef.current?.focus()
        }, 100)
      }
    } catch (error: any) {
      logAuthError(error, 'SignInForm Submit')
      setError({
        message: "An unexpected error occurred. Please try again",
        type: AuthErrorType.SERVER_ERROR
      })

      // Focus error container for screen readers
      setTimeout(() => {
        errorRef.current?.focus()
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (error) {
      clearError()
    }
  }

  // Generate error description ID for aria-describedby
  const errorId = error ? "signin-error" : undefined

  return (
    <div className="mx-auto grid w-full gap-6">
      {/* Accessible Error Alert */}
      {error && (
        <div
          ref={errorRef}
          id={errorId}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Sign-in Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[#003366] dark:text-slate-200">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              placeholder="Enter your username"
              required
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              aria-describedby={errorId}
              aria-invalid={error ? "true" : "false"}
              className="border-[#4d94ff] focus-visible:ring-[#0066cc] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#003366] dark:text-slate-200">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              aria-describedby={errorId}
              aria-invalid={error ? "true" : "false"}
              className="border-[#4d94ff] focus-visible:ring-[#0066cc] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !formData.username.trim() || !formData.password.trim()}
            className="bg-[#0066cc] hover:bg-[#003366] text-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#0066cc] dark:hover:bg-[#003366]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
