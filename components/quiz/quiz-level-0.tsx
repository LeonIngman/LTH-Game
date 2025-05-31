"use client"

import type React from "react"

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

  // Question 2 - Drag and drop categories
  const [q2Categories, setQ2Categories] = useState<{
    Input: string[]
    Process: string[]
    Output: string[]
  }>({
    Input: [],
    Process: [],
    Output: [],
  })

  const [q2AvailableItems, setQ2AvailableItems] = useState([
    "Patties",
    "Burgers",
    "Labor",
    "Facilities",
    "Customer satisfaction",
    "Capacity information",
    "Burger assembly",
    "Profitability",
  ])

  // Question 3 - True/False with justification
  const [q3Answers, setQ3Answers] = useState<Record<string, { answer: string; justification: string }>>({})

  // Question 4 - Single option
  const [q4Answer, setQ4Answer] = useState("")

  // Question 5 - Drag and drop matching
  const [q5Matches, setQ5Matches] = useState<{
    "Make-to-order": { description: string; example: string }
    "Assemble-to-order": { description: string; example: string }
    "Make-to-stock": { description: string; example: string }
    "Engineer-to-order": { description: string; example: string }
  }>({
    "Make-to-order": { description: "", example: "" },
    "Assemble-to-order": { description: "", example: "" },
    "Make-to-stock": { description: "", example: "" },
    "Engineer-to-order": { description: "", example: "" },
  })

  const [q5AvailableDescriptions, setQ5AvailableDescriptions] = useState([
    "Products that use standard components but have customer-specific final configurations of those components.",
    "Products require no customization and are produced in large enough volumes to justify keeping a finished goods inventory.",
    "Products that are customized only at the very end of the manufacturing process.",
    "Products that are designed and produced from the start to meet unusual customer needs or requirements. They represent the highest level of customization.",
  ])

  const [q5AvailableExamples, setQ5AvailableExamples] = useState([
    "Buns",
    "Wedding ring with customer name",
    "Bridge",
    "Furniture with tailored measures",
  ])

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

  // Question 2 drag and drop handlers
  const handleQ2DragStart = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData("text/plain", item)
    e.dataTransfer.setData("source", "available")
  }

  const handleQ2DragStartFromCategory = (e: React.DragEvent, item: string, category: string) => {
    e.dataTransfer.setData("text/plain", item)
    e.dataTransfer.setData("source", category)
  }

  const handleQ2Drop = (e: React.DragEvent, targetCategory: "Input" | "Process" | "Output") => {
    e.preventDefault()
    const item = e.dataTransfer.getData("text/plain")
    const source = e.dataTransfer.getData("source")

    if (source === "available") {
      setQ2AvailableItems((prev) => prev.filter((i) => i !== item))
      setQ2Categories((prev) => ({
        ...prev,
        [targetCategory]: [...prev[targetCategory], item],
      }))
    } else if (source !== targetCategory) {
      setQ2Categories((prev) => ({
        ...prev,
        [source as keyof typeof prev]: prev[source as keyof typeof prev].filter((i) => i !== item),
        [targetCategory]: [...prev[targetCategory], item],
      }))
    }
  }

  const handleQ2RemoveFromCategory = (item: string, category: "Input" | "Process" | "Output") => {
    setQ2Categories((prev) => ({
      ...prev,
      [category]: prev[category].filter((i) => i !== item),
    }))
    setQ2AvailableItems((prev) => [...prev, item])
  }

  // Question 5 drag and drop handlers
  const handleQ5DragStart = (e: React.DragEvent, item: string, type: "description" | "example") => {
    e.dataTransfer.setData("text/plain", item)
    e.dataTransfer.setData("type", type)
  }

  const handleQ5Drop = (e: React.DragEvent, strategy: string, dropType: "description" | "example") => {
    e.preventDefault()
    const item = e.dataTransfer.getData("text/plain")
    const type = e.dataTransfer.getData("type") as "description" | "example"

    if (type === dropType) {
      // Remove from current position if already placed
      const currentStrategy = Object.keys(q5Matches).find((s) => q5Matches[s as keyof typeof q5Matches][type] === item)

      if (currentStrategy) {
        setQ5Matches((prev) => ({
          ...prev,
          [currentStrategy]: {
            ...prev[currentStrategy as keyof typeof prev],
            [type]: "",
          },
        }))
      } else {
        // Remove from available items
        if (type === "description") {
          setQ5AvailableDescriptions((prev) => prev.filter((d) => d !== item))
        } else {
          setQ5AvailableExamples((prev) => prev.filter((e) => e !== item))
        }
      }

      // Add to new position
      setQ5Matches((prev) => ({
        ...prev,
        [strategy]: {
          ...prev[strategy as keyof typeof prev],
          [type]: item,
        },
      }))
    }
  }

  const handleQ5Remove = (strategy: string, type: "description" | "example") => {
    const item = q5Matches[strategy as keyof typeof q5Matches][type]
    if (item) {
      setQ5Matches((prev) => ({
        ...prev,
        [strategy]: {
          ...prev[strategy as keyof typeof prev],
          [type]: "",
        },
      }))

      if (type === "description") {
        setQ5AvailableDescriptions((prev) => [...prev, item])
      } else {
        setQ5AvailableExamples((prev) => [...prev, item])
      }
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    const answers = {
      q1: q1Answers,
      q2: q2Categories,
      q3: q3Answers,
      q4: q4Answer,
      q5: q5Matches,
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
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

        {/* Question 2 - Drag and Drop */}
        <Card>
          <CardHeader>
            <CardTitle>Question 2</CardTitle>
            <CardDescription>
              Drag each component to the correct category in the Input-Process-Output model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Available Items */}
            <div className="space-y-2">
              <h4 className="font-medium">Available Items:</h4>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 border-2 border-dashed border-gray-300 rounded-lg">
                {q2AvailableItems.map((item) => (
                  <div
                    key={item}
                    draggable
                    onDragStart={(e) => handleQ2DragStart(e, item)}
                    className="px-3 py-2 bg-blue-100 border border-blue-300 rounded-lg cursor-move hover:bg-blue-200 transition-colors"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Drop Zones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["Input", "Process", "Output"] as const).map((category) => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-center">{category}</h4>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleQ2Drop(e, category)}
                    className="min-h-[120px] p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                  >
                    {q2Categories[category].map((item) => (
                      <div
                        key={item}
                        draggable
                        onDragStart={(e) => handleQ2DragStartFromCategory(e, item, category)}
                        className="px-3 py-2 mb-2 bg-green-100 border border-green-300 rounded-lg cursor-move hover:bg-green-200 transition-colors flex justify-between items-center"
                      >
                        <span>{item}</span>
                        <button
                          onClick={() => handleQ2RemoveFromCategory(item, category)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

        {/* Question 5 - Manufacturing Strategy Matching */}
        <Card>
          <CardHeader>
            <CardTitle>Question 5</CardTitle>
            <CardDescription>
              Match each production strategy with its description and an example by dragging items to the correct
              positions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Available Descriptions */}
            <div className="space-y-2">
              <h4 className="font-medium">Available Descriptions:</h4>
              <div className="flex flex-col gap-2 min-h-[100px] p-4 border-2 border-dashed border-gray-300 rounded-lg">
                {q5AvailableDescriptions.map((desc) => (
                  <div
                    key={desc}
                    draggable
                    onDragStart={(e) => handleQ5DragStart(e, desc, "description")}
                    className="px-3 py-2 bg-purple-100 border border-purple-300 rounded-lg cursor-move hover:bg-purple-200 transition-colors text-sm"
                  >
                    {desc}
                  </div>
                ))}
              </div>
            </div>

            {/* Available Examples */}
            <div className="space-y-2">
              <h4 className="font-medium">Available Examples:</h4>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-4 border-2 border-dashed border-gray-300 rounded-lg">
                {q5AvailableExamples.map((example) => (
                  <div
                    key={example}
                    draggable
                    onDragStart={(e) => handleQ5DragStart(e, example, "example")}
                    className="px-3 py-2 bg-orange-100 border border-orange-300 rounded-lg cursor-move hover:bg-orange-200 transition-colors"
                  >
                    {example}
                  </div>
                ))}
              </div>
            </div>

            {/* Matching Interface */}
            <div className="space-y-4">
              {Object.keys(q5Matches).map((strategy) => (
                <div key={strategy} className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                  {/* Description Drop Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleQ5Drop(e, strategy, "description")}
                    className="flex-1 min-h-[80px] p-3 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center"
                  >
                    {q5Matches[strategy as keyof typeof q5Matches].description ? (
                      <div className="w-full flex justify-between items-center">
                        <span className="text-sm">{q5Matches[strategy as keyof typeof q5Matches].description}</span>
                        <button
                          onClick={() => handleQ5Remove(strategy, "description")}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Drop description here</span>
                    )}
                  </div>

                  {/* Strategy Name */}
                  <div className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium min-w-[140px] text-center">
                    {strategy}
                  </div>

                  {/* Example Drop Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleQ5Drop(e, strategy, "example")}
                    className="w-48 min-h-[80px] p-3 border-2 border-dashed border-orange-300 rounded-lg bg-white flex items-center justify-center"
                  >
                    {q5Matches[strategy as keyof typeof q5Matches].example ? (
                      <div className="w-full flex justify-between items-center">
                        <span>{q5Matches[strategy as keyof typeof q5Matches].example}</span>
                        <button
                          onClick={() => handleQ5Remove(strategy, "example")}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Drop example here</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
