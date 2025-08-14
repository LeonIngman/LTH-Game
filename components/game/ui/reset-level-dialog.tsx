"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface ResetLevelDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    levelId: number
    levelTitle: string
    onConfirm: () => Promise<void>
    isResetting: boolean
}

export function ResetLevelDialog({
    open,
    onOpenChange,
    levelId,
    levelTitle,
    onConfirm,
    isResetting
}: ResetLevelDialogProps) {
    const [confirmationInput, setConfirmationInput] = useState("")
    const [showSecondaryConfirm, setShowSecondaryConfirm] = useState(false)
    const [resetCompleted, setResetCompleted] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (open) {
            setConfirmationInput("")
            setShowSecondaryConfirm(false)
            setResetCompleted(false)
            // Focus the input when dialog opens
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open])

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!open) return

            if (event.key === "Escape" && !isResetting) {
                event.preventDefault()
                onOpenChange(false)
            }

            if (event.key === "Enter" && !isResetting) {
                event.preventDefault()
                if (showSecondaryConfirm) {
                    handleConfirm()
                } else if (confirmationInput === levelId.toString()) {
                    setShowSecondaryConfirm(true)
                }
            }
        }

        if (open) {
            window.addEventListener("keydown", handleKeyDown)
            return () => window.removeEventListener("keydown", handleKeyDown)
        }
    }, [open, isResetting, confirmationInput, levelId, showSecondaryConfirm, onOpenChange])

    const handleConfirm = async () => {
        if (confirmationInput !== levelId.toString()) return

        try {
            await onConfirm()
            setResetCompleted(true)

            // Auto-close dialog after showing success message
            setTimeout(() => {
                onOpenChange(false)
            }, 1500)
        } catch (error) {
            // Error handling is managed by the parent component
            console.error("Reset failed:", error)
        }
    }

    const handleCancel = () => {
        if (!isResetting) {
            onOpenChange(false)
        }
    }

    const isInputValid = confirmationInput === levelId.toString()

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent
                className="sm:max-w-md"
                aria-describedby="reset-dialog-description"
                onEscapeKeyDown={(e) => {
                    if (isResetting) e.preventDefault()
                }}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        Reset Level {levelId}?
                    </AlertDialogTitle>
                </AlertDialogHeader>

                <div id="reset-dialog-description" className="space-y-4">
                    <AlertDialogDescription className="text-base">
                        This will delete your progress for Level {levelId}: {levelTitle} and cannot be undone.
                        All saved game data, including your score, inventory, and history will be permanently removed.
                    </AlertDialogDescription>

                    {/* Success status announcement */}
                    {resetCompleted && (
                        <div
                            role="status"
                            aria-live="polite"
                            className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
                        >
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                Level {levelId} has been reset successfully. The page will reload with a clean state.
                            </span>
                        </div>
                    )}

                    {!resetCompleted && !showSecondaryConfirm ? (
                        <div className="space-y-2">
                            <Label htmlFor="confirmation-input" className="text-sm font-medium">
                                To confirm, type the level number ({levelId}) below:
                            </Label>
                            <Input
                                ref={inputRef}
                                id="confirmation-input"
                                type="text"
                                value={confirmationInput}
                                onChange={(e) => setConfirmationInput(e.target.value)}
                                placeholder={`Type ${levelId} to confirm`}
                                disabled={isResetting}
                                className={cn(
                                    "text-center text-lg font-mono",
                                    isInputValid && "border-green-500 focus:ring-green-500"
                                )}
                                aria-describedby="input-help"
                                aria-invalid={confirmationInput.length > 0 && !isInputValid}
                            />
                            <p id="input-help" className="text-xs text-muted-foreground">
                                Press Enter to continue or Escape to cancel
                            </p>
                        </div>
                    ) : !resetCompleted ? (
                        <div className="space-y-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                Are you absolutely sure?
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                This action is irreversible. Your Level {levelId} progress will be completely reset.
                            </p>
                        </div>
                    ) : null
                    }
                </div>

                {!resetCompleted && (
                    <AlertDialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isResetting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>

                        {!showSecondaryConfirm ? (
                            <Button
                                variant="destructive"
                                onClick={() => setShowSecondaryConfirm(true)}
                                disabled={!isInputValid || isResetting}
                                className="flex-1"
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                onClick={handleConfirm}
                                disabled={isResetting}
                                className="flex-1"
                                aria-describedby="reset-button-description"
                            >
                                {isResetting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    "Reset Level"
                                )}
                            </Button>
                        )}
                    </AlertDialogFooter>
                )}

                {showSecondaryConfirm && (
                    <p id="reset-button-description" className="sr-only">
                        Final confirmation to reset Level {levelId}. This action cannot be undone.
                    </p>
                )}
            </AlertDialogContent>
        </AlertDialog>
    )
}
