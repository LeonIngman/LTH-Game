"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface StudentSelectorProps {
  students: {
    userId: string
    username: string
    maxScore: number
    maxProfit: number
  }[]
  selectedStudentId: string
  levelId: number
}

export function StudentSelector({ students, selectedStudentId, levelId }: StudentSelectorProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const selectedStudent = students.find((student) => student.userId === selectedStudentId)

  const handleSelectStudent = (studentId: string) => {
    router.push(`/dashboard/teacher/performance/${levelId}/${studentId}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between md:w-[250px]">
          {selectedStudent ? selectedStudent.username : "Select student..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 md:w-[250px]">
        <Command>
          <CommandInput placeholder="Search student..." />
          <CommandList>
            <CommandEmpty>No student found.</CommandEmpty>
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
                  {student.username}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
