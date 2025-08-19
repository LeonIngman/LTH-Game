"use client"

import { useEffect, useState, useActionState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MoreHorizontal, Trash, UserPlus, Shield, Eye, EyeOff, Copy, Check } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"
import { createTeacher, deleteUser } from "@/lib/actions/user-actions"

interface Teacher {
  id: string
  username: string
  email: string
  role: string
  progress: number
  lastActive: string
  createdAt: string
}

interface TeacherManagementProps {
  readonly teachers: Teacher[]
}

// Initial states for the forms
const initialCreateState = { success: false, error: undefined, userId: null, generatedPassword: null }
const initialDeleteState = { success: false, error: undefined }

export function TeacherManagement({ teachers }: TeacherManagementProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [newTeacher, setNewTeacher] = useState({
    username: "",
    email: "",
    password: "",
  })

  // Use the useActionState hook to handle the server actions
  const [createState, createAction] = useActionState(createTeacher, initialCreateState)
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
      const message = createState.generatedPassword 
        ? "Teacher added successfully. Password has been generated."
        : "Teacher added successfully"
      
      toast({
        title: "Success",
        description: message,
      })
      
      // Keep dialog open if password was generated to show it
      if (!createState.generatedPassword) {
        setIsAddDialogOpen(false)
        setNewTeacher({ username: "", email: "", password: "" })
      }
      setIsLoading(false)
      router.refresh()
    }
  }, [createState, router, toast])

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
        description: "Teacher deleted successfully",
      })
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
      setTeacherToDelete(null)
      router.refresh()
    }
  }, [deleteState, router, toast])

  const handleDeleteConfirm = (teacher: Teacher) => {
    setTeacherToDelete(teacher)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false)
    setNewTeacher({ username: "", email: "", password: "" })
    setShowPassword(false)
    setPasswordCopied(false)
  }

  const copyPasswordToClipboard = async () => {
    if (createState.generatedPassword) {
      try {
        await navigator.clipboard.writeText(createState.generatedPassword)
        setPasswordCopied(true)
        toast({
          title: "Password copied",
          description: "The temporary password has been copied to your clipboard",
        })
        setTimeout(() => setPasswordCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy password to clipboard:', error)
        toast({
          title: "Copy failed",
          description: "Could not copy password to clipboard",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Teacher Management
            </CardTitle>
            <CardDescription>Manage teacher accounts and permissions</CardDescription>
          </div>
          <div className="flex gap-2">
            {/* Add Teacher Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                  <DialogDescription>
                    Create a new teacher account. If no password is provided, a secure temporary password will be generated.
                  </DialogDescription>
                </DialogHeader>
                
                {createState.success && createState.generatedPassword ? (
                  // Show generated password
                  <div className="space-y-4 py-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-800 mb-2">Teacher Created Successfully!</h3>
                      <p className="text-sm text-green-700 mb-3">
                        A temporary password has been generated. Please share this with the new teacher:
                      </p>
                      
                      <div className="space-y-2">
                        <Label>Temporary Password</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={createState.generatedPassword}
                            readOnly
                            className="font-mono bg-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={copyPasswordToClipboard}
                          >
                            {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-green-600 mt-2">
                        ⚠️ This password will only be shown once. Make sure to save it securely.
                      </p>
                    </div>
                  </div>
                ) : (
                  // Show form
                  <form action={createAction} onSubmit={() => setIsLoading(true)}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="teacher@example.com"
                          value={newTeacher.email}
                          onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          placeholder="Username for login"
                          value={newTeacher.username}
                          onChange={(e) => setNewTeacher({ ...newTeacher, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password (Optional)</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Leave empty to generate secure password"
                          value={newTeacher.password}
                          onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          If no password is provided, a secure temporary password will be generated and shown once.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={handleCloseAddDialog}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Teacher"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
                
                {createState.success && createState.generatedPassword && (
                  <DialogFooter>
                    <Button onClick={handleCloseAddDialog}>
                      Close
                    </Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Delete Teacher Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Teacher</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {teacherToDelete?.username}? This action cannot be undone and will remove all associated data.
                </DialogDescription>
              </DialogHeader>
              <form action={deleteAction} onSubmit={() => setIsLoading(true)}>
                <div className="space-y-4 py-4">
                  {teacherToDelete && (
                    <>
                      <input type="hidden" name="userId" value={teacherToDelete.id} />
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <p className="text-sm text-destructive font-medium">
                          Teacher: {teacherToDelete.username}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Email: {teacherToDelete.email || "Not provided"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last Active: {teacherToDelete.lastActive}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Teacher
                      </>
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
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="hidden md:table-cell">Last Active</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No teachers found.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.username}</TableCell>
                  <TableCell>{teacher.email || "Not provided"}</TableCell>
                  <TableCell className="hidden md:table-cell">{teacher.createdAt}</TableCell>
                  <TableCell className="hidden md:table-cell">{teacher.lastActive}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteConfirm(teacher)} className="text-red-600">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete Teacher
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
