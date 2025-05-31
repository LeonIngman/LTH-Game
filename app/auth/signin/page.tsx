import Link from "next/link"
import { Suspense } from "react"
import { TruckIcon } from "lucide-react"

import { SignInForm } from "@/components/auth/sign-in-form"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-[#e6f0ff] to-white">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-[#0066cc] p-3">
            <TruckIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#003366]">Sign In</h1>
          <p className="text-gray-600">Enter your credentials to access the Supply Chain Logistics Game</p>
        </div>
        <div className="rounded-xl border border-[#4d94ff] bg-white p-6 shadow-md">
          <Suspense fallback={<div className="text-center">Loading sign-in form...</div>}>
            <SignInForm />
          </Suspense>
        </div>
        {/* <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-[#0066cc] hover:text-[#003366] underline">
            Sign up
          </Link>
        </div> */}
        <div className="text-center text-sm">
          <Link href="/" className="text-[#0066cc] hover:text-[#003366] underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
