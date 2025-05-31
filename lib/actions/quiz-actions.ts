"use server"

import { sql } from "@/lib/db"
import { isV0Preview, shouldUseDemoMode } from "@/lib/v0-detection"

export async function submitQuizAnswers(userId: string, levelId: number, answers: any) {
  try {
    // If in demo mode or v0 preview, simulate success
    if (shouldUseDemoMode() || isV0Preview()) {
      console.log(`[DEMO] Submitting quiz answers for user ${userId}, level ${levelId}`)
      return { success: true }
    }

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
    // If in demo mode or v0 preview, return mock data
    if (shouldUseDemoMode() || isV0Preview()) {
      return [
        {
          userId: "demo-student-1",
          username: "TopStudent",
          submittedAt: new Date().toISOString(),
          answers: {
            q1: ["Raw material availability at Firehouse Foods' premises", "ERP software provider"],
            q2: {
              Patties: "Input",
              Burgers: "Output",
              Labor: "Process",
              Facilities: "Process",
            },
            q3: {
              'In the SCOR model, "Deliver" includes managing returns from customers.': {
                answer: "true",
                justification:
                  "The SCOR model's Deliver process includes managing returns as part of the complete delivery cycle.",
              },
            },
            q4: "Perfect order delivery",
            q5: {
              "Products that use standard components but have customer-specific final configurations of those components.":
                {
                  strategy: "Assemble-to-order",
                  example: "Furniture with tailored measures",
                },
            },
            q6: "MTS (Make-to-stock) because burgers are standardized products produced in advance to meet expected demand.",
          },
        },
      ]
    }

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
