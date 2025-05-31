// lib/v0-detection.ts

/**
 * Checks if the current environment is a v0.dev preview.
 * For a self-hosted production build, this should always be false.
 */
export function isV0Preview(): boolean {
  return false
}

/**
 * Checks if demo mode should be used.
 * This is now solely controlled by the DEMO_MODE environment variable.
 */
export function shouldUseDemoMode(): boolean {
  // Ensure DEMO_MODE is explicitly checked as a string 'true'
  return process.env.DEMO_MODE === "true"
}

// These functions are related to demo mode, not v0 preview directly.
// They can remain if demo mode is still a desired feature, controlled by the DEMO_MODE env var.
// If demo mode is entirely removed, these can be deleted.
// For now, assuming DEMO_MODE might still be used for specific scenarios (e.g., testing).
export const getDemoStudentUser = () => ({
  id: "student-demo-id",
  username: "student_demo",
  role: "student",
  progress: 3,
  email: "student_demo@example.com",
})

export const getDemoTeacherUser = () => ({
  id: "teacher-demo-id",
  username: "teacher_demo",
  role: "teacher",
  progress: 3,
  email: "teacher_demo@example.com",
})
