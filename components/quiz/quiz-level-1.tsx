"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitQuizAnswers } from "@/lib/actions/quiz-actions"
import { useRouter } from "next/navigation"

interface QuizLevel1Props {
  userId: string
}

export function QuizLevel1({ userId }: QuizLevel1Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: {
      blank1: "",
      blank2: "",
      blank3: "",
      blank4: "",
      blank5: "",
    },
    q4: "",
    q5: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Drag and drop state for question 3
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [availableOptions, setAvailableOptions] = useState([
    "costs",
    "accuracy",
    "manufactured",
    "efficiency",
    "profits",
    "flexibility",
    "inventory",
    "responsiveness",
    "quality",
    "delivered",
  ])

  const handleDragStart = (e: React.DragEvent, option: string) => {
    setDraggedItem(option)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, blankNumber: string) => {
    e.preventDefault()
    if (draggedItem) {
      // Get the current value in the blank (if any)
      const currentValue = answers.q3[blankNumber as keyof typeof answers.q3]

      // Update the blank with the dragged item
      setAnswers((prev) => ({
        ...prev,
        q3: {
          ...prev.q3,
          [blankNumber]: draggedItem,
        },
      }))

      // Remove the dragged item from available options
      setAvailableOptions((prev) => prev.filter((option) => option !== draggedItem))

      // If there was a previous value in the blank, add it back to available options
      if (currentValue) {
        setAvailableOptions((prev) => [...prev, currentValue])
      }

      setDraggedItem(null)
    }
  }

  const removeFromBlank = (blankNumber: string) => {
    const currentValue = answers.q3[blankNumber as keyof typeof answers.q3]
    if (currentValue) {
      // Add the value back to available options
      setAvailableOptions((prev) => [...prev, currentValue])

      // Clear the blank
      setAnswers((prev) => ({
        ...prev,
        q3: {
          ...prev.q3,
          [blankNumber]: "",
        },
      }))
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const result = await submitQuizAnswers(userId, 1, answers)
      if (result.success) {
        setSubmitted(true)
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return (
      answers.q1 &&
      answers.q2.trim() &&
      answers.q3.blank1 &&
      answers.q3.blank2 &&
      answers.q3.blank3 &&
      answers.q3.blank4 &&
      answers.q3.blank5 &&
      answers.q4 &&
      answers.q5.trim()
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#e6f0ff] flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Quiz Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for completing the Level 1 quiz. Your answers have been recorded.
            </p>
            <Button onClick={() => router.push("/dashboard/student")} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#e6f0ff] p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-[#2563eb]">
              Level 1 Quiz: Lead Time Management
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {/* Question 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Given the following lead times:
                <br />• Bun supplier lead time = 2.5 days
                <br />• Patty supplier lead time = 3 days
                <br />• Assembly time = 1 day
                <br />
                <br />
                You receive an order due on Day 8 at 5 PM.
                <br />
                What is the latest possible time you can place orders with both suppliers to meet the deadline without
                holding excess inventory?
              </p>
              <RadioGroup value={answers.q1} onValueChange={(value) => setAnswers((prev) => ({ ...prev, q1: value }))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="day1_8am" id="q1_option1" />
                  <Label htmlFor="q1_option1">Day 1, 8 AM</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="day1_6pm" id="q1_option2" />
                  <Label htmlFor="q1_option2">Day 1, 6 PM</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="day4_8am" id="q1_option3" />
                  <Label htmlFor="q1_option3">Day 4, 8 AM</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="day4_6pm" id="q1_option4" />
                  <Label htmlFor="q1_option4">Day 4, 6 PM</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Question 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Your decisions resulted from a cost-lead time trade-off in the game. Which one did you prioritize? Give
                a scenario where your decision would be reverted.
              </p>
              <Textarea
                placeholder="Enter your answer here..."
                value={answers.q2}
                onChange={(e) => setAnswers((prev) => ({ ...prev, q2: e.target.value }))}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Question 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question 3</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Drag the correct term into each blank space to complete the sentence and reflect on the importance of
                lead time in operations management:
              </p>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm leading-relaxed">
                  "In supply chain management, lead time refers to the total time it takes from placing an order to when
                  the product is{" "}
                  <span
                    className={`inline-block min-w-[100px] px-2 py-1 border-2 border-dashed border-gray-300 bg-white rounded ${
                      answers.q3.blank1 ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "blank1")}
                    onClick={() => removeFromBlank("blank1")}
                  >
                    {answers.q3.blank1 || "(1)"}
                  </span>
                  . Longer lead times can result in higher{" "}
                  <span
                    className={`inline-block min-w-[100px] px-2 py-1 border-2 border-dashed border-gray-300 bg-white rounded ${
                      answers.q3.blank2 ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "blank2")}
                    onClick={() => removeFromBlank("blank2")}
                  >
                    {answers.q3.blank2 || "(2)"}
                  </span>{" "}
                  levels, increased{" "}
                  <span
                    className={`inline-block min-w-[100px] px-2 py-1 border-2 border-dashed border-gray-300 bg-white rounded ${
                      answers.q3.blank3 ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "blank3")}
                    onClick={() => removeFromBlank("blank3")}
                  >
                    {answers.q3.blank3 || "(3)"}
                  </span>
                  , and reduced{" "}
                  <span
                    className={`inline-block min-w-[100px] px-2 py-1 border-2 border-dashed border-gray-300 bg-white rounded ${
                      answers.q3.blank4 ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "blank4")}
                    onClick={() => removeFromBlank("blank4")}
                  >
                    {answers.q3.blank4 || "(4)"}
                  </span>{" "}
                  to customer demand. Companies often try to reduce lead time to improve{" "}
                  <span
                    className={`inline-block min-w-[100px] px-2 py-1 border-2 border-dashed border-gray-300 bg-white rounded ${
                      answers.q3.blank5 ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, "blank5")}
                    onClick={() => removeFromBlank("blank5")}
                  >
                    {answers.q3.blank5 || "(5)"}
                  </span>{" "}
                  and stay competitive."
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Available Options:</h4>
                <div className="flex flex-wrap gap-2">
                  {availableOptions.map((option) => (
                    <span
                      key={option}
                      draggable
                      onDragStart={(e) => handleDragStart(e, option)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded cursor-move hover:bg-blue-200 transition-colors"
                    >
                      {option}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-600">
                <strong>Instructions:</strong> Drag the terms from the options above into the blank spaces in the text.
                Click on a filled blank to remove the term.
              </p>
            </CardContent>
          </Card>

          {/* Question 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question 4</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                In the game, you are choosing your production rate daily. On which level is this decision?
              </p>
              <RadioGroup value={answers.q4} onValueChange={(value) => setAnswers((prev) => ({ ...prev, q4: value }))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="operational" id="q4_option1" />
                  <Label htmlFor="q4_option1">Operational</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tactical" id="q4_option2" />
                  <Label htmlFor="q4_option2">Tactical</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="strategic" id="q4_option3" />
                  <Label htmlFor="q4_option3">Strategic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="managerial" id="q4_option4" />
                  <Label htmlFor="q4_option4">Managerial</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Question 5 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question 5</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                You receive a strategic plan for the company. In a 5-year horizon, the company should:
                <br />
                1. Reduce logistics costs by 25%.
                <br />
                2. Maintain 98% service levels.
                <br />
                <br />
                As a member of the tactical team, what changes do you propose?
              </p>
              <Textarea
                placeholder="Enter your tactical proposals here..."
                value={answers.q5}
                onChange={(e) => setAnswers((prev) => ({ ...prev, q5: e.target.value }))}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isSubmitting}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] px-8 py-2"
                >
                  {isSubmitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              </div>
              {!isFormValid() && (
                <p className="text-center text-sm text-gray-500 mt-2">Please answer all questions before submitting.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
