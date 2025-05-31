"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitQuizAnswers } from "@/lib/actions/quiz-actions"

interface QuizLevel3Props {
  userId: string
}

interface TrueFalseAnswer {
  answer: string
  justification: string
}

interface QuizAnswers {
  q1: string
  q2: {
    statement1: TrueFalseAnswer
    statement2: TrueFalseAnswer
    statement3: TrueFalseAnswer
    statement4: TrueFalseAnswer
  }
  q3: string
  q4: string
}

export function QuizLevel3({ userId }: QuizLevel3Props) {
  const [answers, setAnswers] = useState<QuizAnswers>({
    q1: "",
    q2: {
      statement1: { answer: "", justification: "" },
      statement2: { answer: "", justification: "" },
      statement3: { answer: "", justification: "" },
      statement4: { answer: "", justification: "" },
    },
    q3: "",
    q4: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleQ2Change = (statement: keyof QuizAnswers["q2"], field: "answer" | "justification", value: string) => {
    setAnswers((prev) => ({
      ...prev,
      q2: {
        ...prev.q2,
        [statement]: {
          ...prev.q2[statement],
          [field]: value,
        },
      },
    }))
  }

  const validateAnswers = (): boolean => {
    if (!answers.q1) return false
    if (!answers.q3.trim()) return false
    if (!answers.q4.trim()) return false

    // Check all Q2 statements have both answer and justification
    const q2Statements = Object.values(answers.q2)
    for (const statement of q2Statements) {
      if (!statement.answer || !statement.justification.trim()) {
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateAnswers()) {
      setError("Please answer all questions and provide justifications for all true/false statements.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await submitQuizAnswers({
        userId,
        levelId: 3,
        answers: JSON.stringify(answers),
        score: 0, // Score will be calculated by teacher
      })
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Quiz Submitted!</CardTitle>
            <CardDescription>
              Your Level 3 quiz has been submitted successfully. Your teacher will review and grade your responses.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Level 3 Quiz - Stochastic Systems</CardTitle>
            <CardDescription>
              Answer all questions based on your experience with Level 3 of the supply chain game.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Question 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question 1</h3>
              <p className="text-sm text-gray-600">
                In the game, S2's lead time fluctuates between 1 and 3 days (instead of a fixed 2 days). What is the
                most likely consequence of not adjusting the inventory strategy?
              </p>
              <RadioGroup value={answers.q1} onValueChange={(value) => setAnswers((prev) => ({ ...prev, q1: value }))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stable" id="q1-stable" />
                  <Label htmlFor="q1-stable" className="text-sm">
                    Service level remains stable, since average lead time is still of 2 days.
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stockouts" id="q1-stockouts" />
                  <Label htmlFor="q1-stockouts" className="text-sm">
                    Increased risk of stockouts or excess inventory due to mismatched timing.
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="satisfaction" id="q1-satisfaction" />
                  <Label htmlFor="q1-satisfaction" className="text-sm">
                    Improved customer satisfaction due to flexible delivery times.
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="forecasting" id="q1-forecasting" />
                  <Label htmlFor="q1-forecasting" className="text-sm">
                    Reduced need for demand forecasting.
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Question 2 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Question 2</h3>
              <p className="text-sm text-gray-600">
                For each below statement, select whether the statement is true, or false. Justify your choice.
              </p>
              <p className="text-xs text-gray-500 italic">
                Note *Stochastic: Having a random probability distribution or pattern that may be analysed statistically
                but may not be predicted precisely.
              </p>

              {/* Statement 1 */}
              <div className="border rounded-lg p-4 space-y-3">
                <p className="font-medium">Deterministic systems eliminate the need for safety stock.</p>
                <RadioGroup
                  value={answers.q2.statement1.answer}
                  onValueChange={(value) => handleQ2Change("statement1", "answer", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="q2s1-true" />
                    <Label htmlFor="q2s1-true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="q2s1-false" />
                    <Label htmlFor="q2s1-false">False</Label>
                  </div>
                </RadioGroup>
                <Textarea
                  placeholder="Justify your answer..."
                  value={answers.q2.statement1.justification}
                  onChange={(e) => handleQ2Change("statement1", "justification", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Statement 2 */}
              <div className="border rounded-lg p-4 space-y-3">
                <p className="font-medium">
                  Deterministic systems can be optimized exactly, while stochastic systems need probabilistic models to
                  manage risk.
                </p>
                <RadioGroup
                  value={answers.q2.statement2.answer}
                  onValueChange={(value) => handleQ2Change("statement2", "answer", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="q2s2-true" />
                    <Label htmlFor="q2s2-true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="q2s2-false" />
                    <Label htmlFor="q2s2-false">False</Label>
                  </div>
                </RadioGroup>
                <Textarea
                  placeholder="Justify your answer..."
                  value={answers.q2.statement2.justification}
                  onChange={(e) => handleQ2Change("statement2", "justification", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Statement 3 */}
              <div className="border rounded-lg p-4 space-y-3">
                <p className="font-medium">Forecasts are irrelevant in deterministic environments.</p>
                <RadioGroup
                  value={answers.q2.statement3.answer}
                  onValueChange={(value) => handleQ2Change("statement3", "answer", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="q2s3-true" />
                    <Label htmlFor="q2s3-true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="q2s3-false" />
                    <Label htmlFor="q2s3-false">False</Label>
                  </div>
                </RadioGroup>
                <Textarea
                  placeholder="Justify your answer..."
                  value={answers.q2.statement3.justification}
                  onChange={(e) => handleQ2Change("statement3", "justification", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Statement 4 */}
              <div className="border rounded-lg p-4 space-y-3">
                <p className="font-medium">Lead times are always longer in stochastic systems.</p>
                <RadioGroup
                  value={answers.q2.statement4.answer}
                  onValueChange={(value) => handleQ2Change("statement4", "answer", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="q2s4-true" />
                    <Label htmlFor="q2s4-true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="q2s4-false" />
                    <Label htmlFor="q2s4-false">False</Label>
                  </div>
                </RadioGroup>
                <Textarea
                  placeholder="Justify your answer..."
                  value={answers.q2.statement4.justification}
                  onChange={(e) => handleQ2Change("statement4", "justification", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Question 3 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question 3</h3>
              <p className="text-sm text-gray-600">
                In the game, when lead times became unpredictable, how did your inventory or ordering strategy change?
                How about your selling strategy?
              </p>
              <Textarea
                placeholder="Describe how your strategies changed when dealing with unpredictable lead times..."
                value={answers.q3}
                onChange={(e) => setAnswers((prev) => ({ ...prev, q3: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>

            {/* Question 4 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question 4</h3>
              <p className="text-sm text-gray-600">Compare your cost structure in levels 2 and 3. What changed?</p>
              <Textarea
                placeholder="Compare and analyze the cost structure differences between levels 2 and 3..."
                value={answers.q4}
                onChange={(e) => setAnswers((prev) => ({ ...prev, q4: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
