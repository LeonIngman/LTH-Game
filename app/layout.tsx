import type React from "react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"

import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"

// Use the Inter font with only the latin subset to reduce loading issues
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata = {
  title: "Logistics Game Dashboard",
  description: "An interactive game for learning logistics concepts",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
