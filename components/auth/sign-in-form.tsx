"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

export function SignInForm() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/student"
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const { login, user } = useAuth()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)

      // Regular login flow
      const result = await login(formData.username, formData.password)

      setIsLoading(false)

      if (result.success) {
        // Redirect all users directly to their dashboard, skip username setup
        const redirectPath = searchParams.get("callbackUrl") || (result.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student")
        toast({
          title: "Success",
          description: "Signed in successfully",
        })
        console.log("Login successful, redirecting to:", redirectPath)
        router.replace(redirectPath)
      } else {
        toast({
          title: "Error",
          description: result.error || "Invalid username or password",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setIsLoading(false)
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="mx-auto grid w-full gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-[#003366]">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              placeholder="Enter your username"
              required
              value={formData.username}
              onChange={handleChange}
              className="border-[#4d94ff] focus-visible:ring-[#0066cc]"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[#003366]">
                Password
              </Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={handleChange}
              className="border-[#4d94ff] focus-visible:ring-[#0066cc]"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="bg-[#0066cc] hover:bg-[#003366] text-white">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
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
