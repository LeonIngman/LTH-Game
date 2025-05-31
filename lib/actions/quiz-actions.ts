"use server"

import { sql } from "@/lib/db"

export async function submitQuizAnswers(userId: string, levelId: number, answers: any) {
  try {
    // Delete any existing quiz submission for this user and level
    await sql`
      DELETE FROM "QuizSubmission"
      WHERE "userId" = ${userId} AND "levelId" = ${levelId}
    `

    // Insert new quiz submission
    await sql`
      INSERT INTO "QuizSubmission" (
        "userId",
        "levelId",
        "answers",
        "submittedAt"
      ) VALUES (
        ${userId},
        ${levelId},
        ${JSON.stringify(answers)},
        NOW()
      )
    `

    return { success: true }
  } catch (error) {
    console.error("Error submitting quiz answers:", error)
    return { success: false, error: "Failed to submit quiz answers" }
  }
}

export async function getQuizResults(levelId: number) {
  try {
    const results = await sql`
      SELECT 
        qs."userId",
        u.username,
        qs.answers,
        qs."submittedAt"
      FROM "QuizSubmission" qs
      JOIN "User" u ON qs."userId" = u.id
      WHERE qs."levelId" = ${levelId}
      ORDER BY qs."submittedAt" DESC
    `

    return results
  } catch (error) {
    console.error("Error fetching quiz results:", error)
    return []
  }
}
