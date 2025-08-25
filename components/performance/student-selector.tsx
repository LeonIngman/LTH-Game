"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn, formatUsernameAsGroup } from "@/lib/utils"
import { getAllStudents } from "@/lib/actions/user-actions"

interface StudentSelectorProps {
  initialStudents: {
    userId: string
    username: string
    maxScore: number
    maxProfit: number
  }[]
  selectedStudentId: string
  levelId: number
}

export function StudentSelector({ initialStudents, selectedStudentId, levelId }: StudentSelectorProps) {
  const [open, setOpen] = useState(false)
  const [students, setStudents] = useState(initialStudents)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const selectedStudent = students.find((student) => student.userId === selectedStudentId)

  const handleSelectStudent = (studentId: string) => {
    router.push(`/dashboard/teacher/performance/${levelId}/${studentId}`)
    setOpen(false)
  }

  // When setting students, map to correct shape:
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const allStudents = await getAllStudents()
      setStudents(
        allStudents.map((student: any) => ({
          userId: student.id, // <-- ensure this is userId
          username: student.username,
          maxScore: student.maxScore ?? 0,     // fallback if missing
          maxProfit: student.maxProfit ?? 0,   // fallback if missing
        }))
      )
    } catch (error) {
      // handle error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between md:w-[250px]">
          {selectedStudent ? formatUsernameAsGroup(selectedStudent.username, selectedStudent.userId) : "Select group..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 md:w-[250px]">
        <Command>
          <CommandInput placeholder="Search group..." />
          <CommandList>
            <CommandEmpty>No group found.</CommandEmpty>
            <CommandGroup>
              {students.map((student) => (
                <CommandItem
                  key={student.userId}
                  value={student.userId}
                  onSelect={() => handleSelectStudent(student.userId)}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", selectedStudentId === student.userId ? "opacity-100" : "opacity-0")}
                  />
                  {formatUsernameAsGroup(student.username, student.userId)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
