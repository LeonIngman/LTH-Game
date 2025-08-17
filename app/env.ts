// app/env.ts

// NEXTAUTH_SECRET: Critical for security. Must be set in production.
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET) {
  console.error("FATAL: NEXTAUTH_SECRET environment variable is not set in production.")
  throw new Error("FATAL: NEXTAUTH_SECRET environment variable is not set in production.")
}
export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "default_development_secret_do_not_use_in_prod"

// DATABASE_URL: Also critical. pg library will use this.
export const DATABASE_URL = process.env.DATABASE_URL || ""
if (!DATABASE_URL && process.env.NODE_ENV !== "test") {
  // Avoid error during tests if not set
  console.error("Warning: DATABASE_URL environment variable is not set.")
}

// DEMO_MODE: Explicitly enable via environment variable. Defaults to false.
export const DEMO_MODE = process.env.DEMO_MODE === "true"

// NEXT_PUBLIC_VERCEL_ENV: This is Vercel-specific.
// For self-hosting, it will typically be undefined, making this false.
// If any code relies on this, it should be reviewed.
export const NEXT_PUBLIC_VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV === "true"
