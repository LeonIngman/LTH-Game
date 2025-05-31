"use client"

console.log("DashboardLayout loaded") // <--- Add this line

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { useAuth } from "@/lib/auth-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("DashboardLayout user:", user, "loading:", loading)
    if (!loading && !user) {
      router.push("/auth/signin")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#e6f0ff] to-white">
        <div className="text-[#0066cc] text-lg font-medium">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#e6f0ff] to-white">
      <DashboardNav />
      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  )
}
