import "next-auth"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    username: string
    role: string
    progress: number
  }

  interface Session {
    user: {
      id: string
      username: string
      role: string
      progress: number
    } & DefaultSession["user"]
  }
}
