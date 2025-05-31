"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { submitQuizAnswers } from "@/lib/actions/quiz-actions"

interface QuizLevel0Props {
  userId: string
}

export function QuizLevel0({ userId }: QuizLevel0Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Question 1 - Multi-option
  const [q1Answers, setQ1Answers] = useState<string[]>([])

  // Question 2 - Drag and drop (simplified as dropdowns for now)
  const [q2Answers, setQ2Answers] = useState<Record<string, string>>({})

  // Question 3 - True/False with justification
  const [q3Answers, setQ3Answers] = useState<Record<string, { answer: string; justification: string }>>({})

  // Question 4 - Single option
  const [q4Answer, setQ4Answer] = useState("")

  // Question 5 - Matching (simplified as dropdowns)
  const [q5Answers, setQ5Answers] = useState<Record<string, { strategy: string; example: string }>>({})

  // Question 6 - Text answer
  const [q6Answer, setQ6Answer] = useState("")

  const handleQ1Change = (option: string, checked: boolean) => {
    if (checked) {
      setQ1Answers([...q1Answers, option])
    } else {
      setQ1Answers(q1Answers.filter((a) => a !== option))
    }
  }

  const handleQ3Change = (question: string, field: "answer" | "justification", value: string) => {
    setQ3Answers({
      ...q3Answers,
      [question]: {
        ...q3Answers[question],
        [field]: value,
      },
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const answers = {
      q1: q1Answers,
      q2: q2Answers,
      q3: q3Answers,
      q4: q4Answer,
      q5: q5Answers,
      q6: q6Answer,
    }

    try {
      const result = await submitQuizAnswers(userId, 0, answers)
      if (result.success) {
        toast({
          title: "Quiz Submitted",
          description: "Your answers have been saved successfully!",
        })
        router.push("/dashboard/student")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit quiz",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const q1Options = [
    "Order delivery to Yummy Zone",
    "Burger warehouse storage",
    "Raw material availability at Firehouse Foods' premises",
    "ERP software provider",
    "Online orders from customers to the retailers",
    "Assembly machine maintenance",
  ]

  const q2Items = [
    "Patties",
    "Burgers",
    "Labor",
    "Facilities",
    "Customer satisfaction",
    "Capacity information",
    "Burger assembly",
    "Profitability",
  ]
  const q2Categories = ["Input", "Process", "Output"]

  const q3Questions = [
    'In the SCOR model, "Deliver" includes managing returns from customers.',
    "In the game, Firehouse Foods is your preferred potatoes supplier. That makes Brown Sauce your second-tier supplier for potatoes.",
    "Your burgers are currently competing in the market based on price. There is a new government safety regulation for patty fat percentage. Complying with this regulation is an order winner.",
  ]

  const q4Options = [
    "Perfect order delivery",
    "Order cycle time",
    "Inventory turnover ratio",
    "Carrier performance score",
  ]

  const q5Descriptions = [
    "Products that use standard components but have customer-specific final configurations of those components.",
    "Products require no customization and are produced in large enough volumes to justify keeping a finished goods inventory.",
    "Products that are customized only at the very end of the manufacturing process.",
    "Products that are designed and produced from the start to meet unusual customer needs or requirements. They represent the highest level of customization.",
  ]

  const q5Strategies = ["Make-to-order", "Assemble-to-order", "Make-to-stock", "Engineer-to-order"]
  const q5Examples = ["Buns", "Wedding ring with customer name", "Bridge", "Furniture with tailored measures"]

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#003366] mb-2">Level 0 Quiz</h1>
        <p className="text-gray-600">Test your understanding of supply chain fundamentals</p>
      </div>

      <div className="space-y-8">
        {/* Question 1 */}
        <Card>
          <CardHeader>
            <CardTitle>Question 1</CardTitle>
            <CardDescription>
              Which of the following are part of your team's upstream supply chain? (Select all that apply)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {q1Options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`q1-${index}`}
                  checked={q1Answers.includes(option)}
                  onCheckedChange={(checked) => handleQ1Change(option, checked as boolean)}
                />
                <Label htmlFor={`q1-${index}`}>{option}</Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Question 2 */}
        <Card>
          <CardHeader>
            <CardTitle>Question 2</CardTitle>
            <CardDescription>
              Relate each component to the Input-Process-Output model by selecting the correct category for each item.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {q2Items.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Label className="w-48">{item}</Label>
                <select
                  className="border rounded px-3 py-2"
                  value={q2Answers[item] || ""}
                  onChange={(e) => setQ2Answers({ ...q2Answers, [item]: e.target.value })}
                >
                  <option value="">Select category</option>
                  {q2Categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Question 3 */}
        <Card>
          <CardHeader>
            <CardTitle>Question 3</CardTitle>
            <CardDescription>
              Answer True or False for each statement and provide a brief justification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {q3Questions.map((question, index) => (
              <div key={index} className="space-y-3">
                <p className="font-medium">{question}</p>
                <RadioGroup
                  value={q3Answers[question]?.answer || ""}
                  onValueChange={(value) => handleQ3Change(question, "answer", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`q3-${index}-true`} />
                    <Label htmlFor={`q3-${index}-true`}>True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`q3-${index}-false`} />
                    <Label htmlFor={`q3-${index}-false`}>False</Label>
                  </div>
                </RadioGroup>
                <Textarea
                  placeholder="Justify your answer..."
                  value={q3Answers[question]?.justification || ""}
                  onChange={(e) => handleQ3Change(question, "justification", e.target.value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Question 4 */}
        <Card>
          <CardHeader>
            <CardTitle>Question 4</CardTitle>
            <CardDescription>
              You are the logistics officer in the game and decide to implement a metric that assesses the following:
              Delivered on time, according to the buyer's requested delivery date; Shipped complete; Invoiced correctly;
              Undamaged in transit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={q4Answer} onValueChange={setQ4Answer}>
              {q4Options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`q4-${index}`} />
                  <Label htmlFor={`q4-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Question 5 */}
        <Card>
          <CardHeader>
            <CardTitle>Question 5</CardTitle>
            <CardDescription>Match each production strategy with its description and an example.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {q5Descriptions.map((description, index) => (
              <div key={index} className="space-y-2">
                <p className="font-medium text-sm">{description}</p>
                <div className="flex space-x-4">
                  <select
                    className="border rounded px-3 py-2 flex-1"
                    value={q5Answers[description]?.strategy || ""}
                    onChange={(e) =>
                      setQ5Answers({
                        ...q5Answers,
                        [description]: { ...q5Answers[description], strategy: e.target.value },
                      })
                    }
                  >
                    <option value="">Select strategy</option>
                    {q5Strategies.map((strategy) => (
                      <option key={strategy} value={strategy}>
                        {strategy}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border rounded px-3 py-2 flex-1"
                    value={q5Answers[description]?.example || ""}
                    onChange={(e) =>
                      setQ5Answers({
                        ...q5Answers,
                        [description]: { ...q5Answers[description], example: e.target.value },
                      })
                    }
                  >
                    <option value="">Select example</option>
                    {q5Examples.map((example) => (
                      <option key={example} value={example}>
                        {example}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Question 6 */}
        <Card>
          <CardHeader>
            <CardTitle>Question 6</CardTitle>
            <CardDescription>
              Under which production strategy (ETO, MTO, ATO, MTS) are you producing the game burgers? Justify your
              choice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter your answer and justification..."
              value={q6Answer}
              onChange={(e) => setQ6Answer(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#0066cc] hover:bg-[#003366] px-8 py-2">
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </div>
    </div>
  )
}
