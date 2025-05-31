import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { sql } from "./db"
import { z } from "zod"
import bcryptjs from "bcryptjs"

async function getUser(username: string): Promise<User | undefined> {
  try {
    const user = await sql<User>`SELECT * from "User" WHERE username=${username}`
    return user[0]
  } catch (error) {
    console.error("Failed to fetch user:", error)
    throw new Error("Failed to fetch user.")
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string().min(1), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          console.log("Invalid credentials format")
          return null
        }

        const { username, password } = parsedCredentials.data
        const user = await getUser(username)
        if (!user) return null

        if (!user.password || !user.password.startsWith("$2")) {
          console.error(`User ${user.username} does not have a valid hashed password in the database. This is a security risk.`)
          return null
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password)
        if (isPasswordValid) {
          return user
        }

        console.log("Invalid credentials")
        return null
      },
    }),
  ],
}
