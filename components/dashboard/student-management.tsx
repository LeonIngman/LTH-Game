"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { Loader2, MoreHorizontal, Pencil, Trash, UserPlus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Slider } from "@/components/ui/slider"
import { createUser, createBatchUsers, deleteUser, updateUserProgress } from "@/lib/actions/user-actions"

interface Student {
  id: string
  username: string
  visible_password: string
  progress: number
  lastActive: string
}

interface StudentManagementProps {
  students: Student[]
}

// Initial states for the forms
const initialCreateState = { success: false, error: null, userId: null }
const initialBatchCreateState = { success: false, error: null, userIds: [] }
const initialUpdateState = { success: false, error: null }
const initialDeleteState = { success: false, error: null }

// Function to generate a random password
const generateRandomPassword = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Function to generate multiple unique passwords
const generateUniquePasswords = (count: number, length = 8) => {
  const passwords = new Set<string>()
  while (passwords.size < count) {
    passwords.add(generateRandomPassword(length))
  }
  return Array.from(passwords)
}

export function StudentManagement({ students }: StudentManagementProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isBatchAddDialogOpen, setIsBatchAddDialogOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    username: "",
    password: generateRandomPassword(),
  })
  const [batchStudents, setBatchStudents] = useState({
    prefix: "Team",
    count: 5,
    useCustomPasswords: true, // Default to true for unique passwords
    customPasswords: generateUniquePasswords(5), // Initialize with 5 unique passwords
  })
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [progressValue, setProgressValue] = useState<number>(0)

  // Use the useActionState hook to handle the server actions
  const [createState, createAction] = useActionState(createUser, initialCreateState)
  const [batchCreateState, batchCreateAction] = useActionState(createBatchUsers, initialBatchCreateState)
  const [updateState, updateAction] = useActionState(updateUserProgress, initialUpdateState)
  const [deleteState, deleteAction] = useActionState(deleteUser, initialDeleteState)

  // Handle responses from server actions
  useEffect(() => {
    if (createState.error) {
      toast({
        title: "Error",
        description: createState.error,
        variant: "destructive",
      })
      setIsLoading(false)
    } else if (createState.success) {
      toast({
        title: "Success",
        description: "Student added successfully",
      })
      setIsAddDialogOpen(false)
      setNewStudent({ username: "", password: generateRandomPassword() })
      setIsLoading(false)
      router.refresh()
    }
  }, [createState, router, toast])

  useEffect(() => {
    if (batchCreateState.error) {
      toast({
        title: "Error",
        description: batchCreateState.error,
        variant: "destructive",
      })
      setIsLoading(false)
    } else if (batchCreateState.success) {
      toast({
        title: "Success",
        description: `${batchCreateState.userIds.length} students added successfully`,
      })
      setIsBatchAddDialogOpen(false)
      setBatchStudents({
        prefix: "Team",
        count: 5,
        useCustomPasswords: true,
        customPasswords: generateUniquePasswords(5),
      })
      setIsLoading(false)
      router.refresh()
    }
  }, [batchCreateState, router, toast])

  useEffect(() => {
    if (updateState.error) {
      toast({
        title: "Error",
        description: updateState.error,
        variant: "destructive",
      })
      setIsLoading(false)
    } else if (updateState.success) {
      toast({
        title: "Success",
        description: `Updated progress successfully`,
      })
      setSelectedStudent(null)
      setIsLoading(false)
      router.refresh()
    }
  }, [updateState, router, toast])

  useEffect(() => {
    if (deleteState.error) {
      toast({
        title: "Error",
        description: deleteState.error,
        variant: "destructive",
      })
      setIsLoading(false)
    } else if (deleteState.success) {
      toast({
        title: "Success",
        description: "Student deleted successfully",
      })
      setIsLoading(false)
      router.refresh()
    }
  }, [deleteState, router, toast])

  // Update passwords when count changes
  useEffect(() => {
    setBatchStudents((prevBatchStudents) => {
      if (prevBatchStudents.count !== prevBatchStudents.customPasswords.length) {
        return {
          ...prevBatchStudents,
          customPasswords: generateUniquePasswords(prevBatchStudents.count),
        }
      }
      return prevBatchStudents
    })
  }, [setBatchStudents])

  const handleDeleteConfirm = (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return
    setIsLoading(true)
    const formData = new FormData()
    formData.append("userId", id)
    deleteAction(formData)
  }

  const handleCustomPasswordChange = (index: number, value: string) => {
    const newPasswords = [...batchStudents.customPasswords]
    newPasswords[index] = value
    setBatchStudents({
      ...batchStudents,
      customPasswords: newPasswords,
    })
  }

  const generatePreviewUsernames = () => {
    const usernames = []
    for (let i = 1; i <= Math.min(3, batchStudents.count); i++) {
      usernames.push(`${batchStudents.prefix} - Team ${i}`)
    }
    if (batchStudents.count > 3) {
      usernames.push("...")
      usernames.push(`${batchStudents.prefix} - Team ${batchStudents.count}`)
    }
    return usernames
  }

  // Function to regenerate all passwords
  const regenerateAllPasswords = () => {
    setBatchStudents({
      ...batchStudents,
      customPasswords: generateUniquePasswords(batchStudents.count),
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Management</CardTitle>
            <CardDescription>Manage student accounts and progress</CardDescription>
          </div>
          <div className="flex gap-2">
            {/* Batch Add Students Dialog */}
            <Dialog open={isBatchAddDialogOpen} onOpenChange={setIsBatchAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Add Multiple Students
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Multiple Students</DialogTitle>
                  <DialogDescription>Create multiple student accounts at once.</DialogDescription>
                </DialogHeader>
                <form action={batchCreateAction} onSubmit={() => setIsLoading(true)}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="prefix">Username Prefix</Label>
                      <Input
                        id="prefix"
                        name="prefix"
                        placeholder="Team"
                        value={batchStudents.prefix}
                        onChange={(e) => setBatchStudents({ ...batchStudents, prefix: e.target.value })}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Students will be named: {batchStudents.prefix} - Team 1, {batchStudents.prefix} - Team 2, etc.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="count">Number of Students</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          id="count"
                          min={1}
                          max={50}
                          step={1}
                          value={[batchStudents.count]}
                          onValueChange={(value) => setBatchStudents({ ...batchStudents, count: value[0] })}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={batchStudents.count}
                          onChange={(e) =>
                            setBatchStudents({ ...batchStudents, count: Number.parseInt(e.target.value) || 1 })
                          }
                          className="w-20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Username Preview</Label>
                      <div className="rounded-md border p-2">
                        <ul className="space-y-1">
                          {generatePreviewUsernames().map((username, index) => (
                            <li key={index} className="text-sm">
                              {username}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Individual Passwords</Label>
                      <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                        {batchStudents.customPasswords.map((password, index) => (
                          <div key={index} className="mb-2 flex items-center gap-2">
                            <span className="text-sm font-medium w-32 truncate">
                              {batchStudents.prefix} - Team {index + 1}:
                            </span>
                            <Input
                              type="text"
                              value={password}
                              onChange={(e) => handleCustomPasswordChange(index, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCustomPasswordChange(index, generateRandomPassword())}
                            >
                              🔄
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button type="button" variant="outline" size="sm" onClick={regenerateAllPasswords}>
                          Regenerate All Passwords
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Each team will receive a unique auto-generated password for security. You can customize
                        individual passwords or regenerate them as needed.
                      </p>
                    </div>

                    <input
                      type="hidden"
                      name="batchData"
                      value={JSON.stringify({
                        prefix: batchStudents.prefix,
                        count: batchStudents.count,
                        useCustomPasswords: true,
                        customPasswords: batchStudents.customPasswords,
                      })}
                    />
                    <input type="hidden" name="role" value="student" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsBatchAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Students"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Add Single Student Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>Create a new student account for the logistics game.</DialogDescription>
                </DialogHeader>
                <form action={createAction} onSubmit={() => setIsLoading(true)}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="Username for login and leaderboard"
                        value={newStudent.username}
                        onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          name="password"
                          type="text"
                          value={newStudent.password}
                          onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                          required
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewStudent({ ...newStudent, password: generateRandomPassword() })}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>
                    <input type="hidden" name="role" value="student" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Student"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Progress</DialogTitle>
                <DialogDescription>Update the game progress for {selectedStudent?.username}</DialogDescription>
              </DialogHeader>
              <form action={updateAction} onSubmit={() => setIsLoading(true)}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="progress">Progress Level (0-3)</Label>
                    <Input
                      id="progress"
                      name="progress"
                      type="number"
                      min="0"
                      max="3"
                      value={progressValue}
                      onChange={(e) => setProgressValue(Number(e.target.value))}
                      required
                    />
                  </div>
                  {selectedStudent && <input type="hidden" name="userId" value={selectedStudent.id} />}
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setSelectedStudent(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Progress"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="hidden md:table-cell">Last Active</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.username}</TableCell>
                <TableCell>{student.visible_password}</TableCell>
                <TableCell>Level {student.progress}</TableCell>
                <TableCell className="hidden md:table-cell">{student.lastActive}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedStudent(student)
                          setProgressValue(student.progress)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Update Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteConfirm(student.id)} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Student
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
