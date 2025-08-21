import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a username to display as a group name
 * Examples: "Leon" -> "Group 1", "user_abc123" -> "Group 2", etc.
 */
export function formatUsernameAsGroup(username: string, userId?: string): string {
  // If username already starts with "Group-", extract the number
  if (username.startsWith("Group-")) {
    const groupNumber = username.replace("Group-", "")
    return `Group ${groupNumber}`
  }

  // If we have a userId, try to extract a number from it
  if (userId) {
    const regex = /\d+/
    const match = regex.exec(userId)
    if (match) {
      return `Group ${match[0]}`
    }
  }

  // Fallback: generate a simple hash-based number from username
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  const groupNumber = Math.abs(hash % 999) + 1 // Ensure positive number 1-999

  return `Group ${groupNumber}`
}
