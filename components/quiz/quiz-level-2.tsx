"use client"

import type React from "react"

import { useState } from "react"
import { submitQuizAnswers } from "@/lib/actions/quiz-actions"
import { CheckCircle } from "lucide-react"

interface QuizLevel2Props {
  userId: string
}

export function QuizLevel2({ userId }: QuizLevel2Props) {
  const [q1Answers, setQ1Answers] = useState<string[]>([])
  const [q2Answer, setQ2Answer] = useState("")
  const [q3Answer, setQ3Answer] = useState("")
  const [q4Answer, setQ4Answer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleQ1Change = (option: string) => {
    if (q1Answers.includes(option)) {
      setQ1Answers(q1Answers.filter((item) => item !== option))
    } else {
      setQ1Answers([...q1Answers, option])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all questions are answered
    if (q1Answers.length === 0 || !q2Answer || !q3Answer || !q4Answer) {
      setError("Please answer all questions before submitting.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const answers = {
        q1: q1Answers,
        q2: q2Answer,
        q3: q3Answer,
        q4: q4Answer,
      }

      await submitQuizAnswers(userId, 2, answers)
      setIsSubmitted(true)
    } catch (err) {
      setError("Failed to submit quiz. Please try again.")
      console.error("Quiz submission error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-10">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Submitted Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing the Level 2 quiz. Your answers have been recorded.
          </p>
          <a
            href="/dashboard/student"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-8">Level 2 Quiz: Forecasting & Planning</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Question 1 - Multi-choice */}
        <div className="quiz-question">
          <h2 className="text-lg font-semibold mb-3">Question 1</h2>
          <p className="mb-4">
            The demand for C1 and the exponential smoothing forecast applied from periods 1 to 6 are expressed in the
            table below.
          </p>

          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Forecast type</th>
                  <th className="border border-gray-300 px-4 py-2">Period 1</th>
                  <th className="border border-gray-300 px-4 py-2">Period 2</th>
                  <th className="border border-gray-300 px-4 py-2">Period 3</th>
                  <th className="border border-gray-300 px-4 py-2">Period 4</th>
                  <th className="border border-gray-300 px-4 py-2">Period 5</th>
                  <th className="border border-gray-300 px-4 py-2">Period 6</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">Demand</td>
                  <td className="border border-gray-300 px-4 py-2">55</td>
                  <td className="border border-gray-300 px-4 py-2">39</td>
                  <td className="border border-gray-300 px-4 py-2">74</td>
                  <td className="border border-gray-300 px-4 py-2">56</td>
                  <td className="border border-gray-300 px-4 py-2">50</td>
                  <td className="border border-gray-300 px-4 py-2">60</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">Forecast</td>
                  <td className="border border-gray-300 px-4 py-2">24</td>
                  <td className="border border-gray-300 px-4 py-2">33</td>
                  <td className="border border-gray-300 px-4 py-2">45</td>
                  <td className="border border-gray-300 px-4 py-2">54</td>
                  <td className="border border-gray-300 px-4 py-2">55</td>
                  <td className="border border-gray-300 px-4 py-2">60</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-3">Based on this information, select all the correct options:</p>

          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={q1Answers.includes("MAD=12.17")}
                onChange={() => handleQ1Change("MAD=12.17")}
              />
              <span className="ml-2">MAD=12.17</span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={q1Answers.includes("FE_5 = 5")}
                onChange={() => handleQ1Change("FE_5 = 5")}
              />
              <span className="ml-2">FE_5 = 5</span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={q1Answers.includes("The forecasting model is performing normally")}
                onChange={() => handleQ1Change("The forecasting model is performing normally")}
              />
              <span className="ml-2">The forecasting model is performing normally</span>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={q1Answers.includes("The magnitude of the errors is about 21 %")}
                onChange={() => handleQ1Change("The magnitude of the errors is about 21 %")}
              />
              <span className="ml-2">The magnitude of the errors is about 21 %</span>
            </label>
          </div>
        </div>

        {/* Question 2 - Text input */}
        <div className="quiz-question">
          <h2 className="text-lg font-semibold mb-3">Question 2</h2>
          <p className="mb-3">
            In the game, you calculated MFE and MAD for your forecast. Reflect on these metrics to assess bias in
            forecasting models.
          </p>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
            value={q2Answer}
            onChange={(e) => setQ2Answer(e.target.value)}
            placeholder="Enter your answer here..."
          ></textarea>
        </div>

        {/* Question 3 - Single choice */}
        <div className="quiz-question">
          <h2 className="text-lg font-semibold mb-3">Question 3</h2>
          <p className="mb-3">
            Why is demand forecasting still important in a <em>Pull system</em>, even though production is triggered by
            actual orders?
          </p>
          <p className="mb-4 text-sm italic">
            Note: <em>Pull system</em>: A production system in which actual downstream demand sets off a chain of events
            that pulls material through the various process steps.
          </p>

          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="radio"
                name="q3"
                className="mt-1 h-4 w-4"
                value="To eliminate the need for safety stock."
                checked={q3Answer === "To eliminate the need for safety stock."}
                onChange={(e) => setQ3Answer(e.target.value)}
              />
              <span className="ml-2">To eliminate the need for safety stock.</span>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="q3"
                className="mt-1 h-4 w-4"
                value="To align long-term capacity and supplier contracts."
                checked={q3Answer === "To align long-term capacity and supplier contracts."}
                onChange={(e) => setQ3Answer(e.target.value)}
              />
              <span className="ml-2">To align long-term capacity and supplier contracts.</span>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="q3"
                className="mt-1 h-4 w-4"
                value="Pull systems rely entirely on real-time data; forecasts are irrelevant."
                checked={q3Answer === "Pull systems rely entirely on real-time data; forecasts are irrelevant."}
                onChange={(e) => setQ3Answer(e.target.value)}
              />
              <span className="ml-2">Pull systems rely entirely on real-time data; forecasts are irrelevant.</span>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="q3"
                className="mt-1 h-4 w-4"
                value="To replace kanban signals with predictive analytics."
                checked={q3Answer === "To replace kanban signals with predictive analytics."}
                onChange={(e) => setQ3Answer(e.target.value)}
              />
              <span className="ml-2">To replace kanban signals with predictive analytics.</span>
            </label>
          </div>
        </div>

        {/* Question 4 - Single choice */}
        <div className="quiz-question">
          <h2 className="text-lg font-semibold mb-3">Question 4</h2>
          <p className="mb-3">
            You have calculated a forecast of 3000 burgers per week, but there have been variations per your actual
            demand. If you have considered your forecast for the MRP, which action would most effectively reduce the MRP
            nervousness while maintaining supply continuity?
          </p>

          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="radio"
                name="q4"
                className="mt-1 h-4 w-4"
                value="Increase the forecast, just in case demand spikes."
                checked={q4Answer === "Increase the forecast, just in case demand spikes."}
                onChange={(e) => setQ4Answer(e.target.value)}
              />
              <span className="ml-2">Increase the forecast, just in case demand spikes.</span>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="q4"
                className="mt-1 h-4 w-4"
                value="Avoid changing the production rate every time demand fluctuates."
                checked={q4Answer === "Avoid changing the production rate every time demand fluctuates."}
                onChange={(e) => setQ4Answer(e.target.value)}
              />
              <span className="ml-2">Avoid changing the production rate every time demand fluctuates.</span>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="q4"
                className="mt-1 h-4 w-4"
                value="Stop forecasting and only use actual sales numbers."
                checked={q4Answer === "Stop forecasting and only use actual sales numbers."}
                onChange={(e) => setQ4Answer(e.target.value)}
              />
              <span className="ml-2">Stop forecasting and only use actual sales numbers.</span>
            </label>

            <label className="flex items-start">
              <input
                type="radio"
                name="q4"
                className="mt-1 h-4 w-4"
                value="Wait until stockout before placing new orders."
                checked={q4Answer === "Wait until stockout before placing new orders."}
                onChange={(e) => setQ4Answer(e.target.value)}
              />
              <span className="ml-2">Wait until stockout before placing new orders.</span>
            </label>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-blue-400"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      </form>
    </div>
  )
}
