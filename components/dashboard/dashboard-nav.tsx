"use client"

import Link from "next/link"
import { Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { FeedbackDialog } from "@/components/feedback-dialog"
import { formatUsernameAsGroup } from "@/lib/utils"

export function DashboardNav() {
  const { user, logout } = useAuth()

  if (!user) return null

  const isTeacher = user.role === "teacher"
  const dashboardPath = isTeacher ? "/dashboard/teacher" : "/dashboard/student"

  return (
    <header className="sticky top-0 z-10 border-b border-[#4d94ff] bg-white shadow-sm">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link href={dashboardPath} className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-[#0066cc]" />
          <h1 className="text-xl font-bold text-[#003366]">Logistics Game</h1>
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <FeedbackDialog />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-[#4d94ff]">
                <span className="sr-only">Group menu</span>
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-sm">👤</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[#4d94ff]">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.role === 'student' ? formatUsernameAsGroup(user.username, user.id) : user.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email || user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <span className="mr-2">🚪</span>
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
