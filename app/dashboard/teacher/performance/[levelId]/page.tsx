import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"

import { PerformanceSummary } from "@/components/performance/performance-summary"
import { StudentSelector } from "@/components/performance/student-selector"
import { authOptions } from "@/lib/auth-options"
import { getAllStudents } from "@/lib/actions/user-actions"
import { getPerformanceData } from "@/lib/actions/performance-actions"
import { isV0Preview, shouldUseDemoMode } from "@/lib/v0-detection"

// Mock data for immediate rendering
const mockStudents = [
  { id: "student-1", username: "TopStudent", progress: 3 },
  { id: "student-2", username: "LogisticsWiz", progress: 3 },
  { id: "student-3", username: "SupplyChainMaster", progress: 2 },
  { id: "student-4", username: "InventoryPro", progress: 2 },
  { id: "student-5", username: "ShippingExpert", progress: 1 },
]

export default async function TeacherPerformancePage({ params }: { params: { levelId: string } }) {
  const session = await getServerSession(authOptions)

  // Redirect if not logged in or not a teacher
  if (!session || !session.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "teacher") {
    redirect("/dashboard/student")
  }

  const levelId = Number.parseInt(params.levelId)

  // Validate level ID
  if (isNaN(levelId) || levelId < 0 || levelId > 3) {
    redirect("/dashboard/teacher")
  }

  // Get all students
  let students = []

  if (shouldUseDemoMode() || isV0Preview()) {
    students = mockStudents
  } else {
    const allStudents = await getAllStudents()
    students = allStudents.map((student) => ({
      id: student.id,
      username: student.username,
      progress: student.progress,
    }))
  }

  // Get performance data for all students at this level
  const performanceData = await getPerformanceData(levelId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Level {levelId} Performance</h1>
        <p className="text-gray-500">View and analyze student performance for Level {levelId}.</p>
      </div>

      <StudentSelector students={students} levelId={levelId} />

      <PerformanceSummary performanceData={performanceData} levelId={levelId} />
    </div>
  )
}
