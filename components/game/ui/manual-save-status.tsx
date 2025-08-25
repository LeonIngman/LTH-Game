"use client"

import { CheckCircle, CloudOff, Loader2, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCallback, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/lib/i18n"

interface ManualSaveStatusProps {
    isSaving: boolean
    lastSaved: Date | null
    isDirty: boolean
    isLoadingState: boolean
    onSave: () => Promise<void>
    className?: string
}

export function ManualSaveStatus({
    isSaving,
    lastSaved,
    isDirty,
    isLoadingState,
    onSave,
    className
}: ManualSaveStatusProps) {
    const { toast } = useToast()
    const { translations } = useTranslation()

    const formatLastSaved = (date: Date) => {
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) {
            return translations.game.savedJustNow
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60)
            return translations.game.savedTimeAgo.replace('{time}', `${minutes}m`)
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    }

    const handleSave = useCallback(async () => {
        try {
            await onSave()
        } catch (error) {
            console.error("Save failed:", error)
            // Error toast is already handled in the hook
        }
    }, [onSave])

    // Keyboard shortcut: Cmd/Ctrl + S
    useEffect(() => {
        const handleKeyboard = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 's') {
                event.preventDefault()
                if (!isSaving && !isLoadingState) {
                    handleSave()
                }
            }
        }

        window.addEventListener('keydown', handleKeyboard)
        return () => window.removeEventListener('keydown', handleKeyboard)
    }, [handleSave, isSaving, isLoadingState])

    // Announce save shortcut to screen readers
    useEffect(() => {
        const announcement = "Press Command S or Control S to save your progress"
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            // Only announce once when component mounts
            const utterance = new SpeechSynthesisUtterance("")
            utterance.volume = 0 // Silent but triggers screen reader announcement
            speechSynthesis.speak(utterance)
        }
    }, [])

    const getStatusContent = () => {
        if (isLoadingState) {
            return {
                icon: <Loader2 className="h-4 w-4 animate-spin" />,
                text: translations.common.loading,
                className: "text-muted-foreground"
            }
        }

        if (isSaving) {
            return {
                icon: <Loader2 className="h-4 w-4 animate-spin" />,
                text: translations.game.saving,
                className: "text-blue-600 dark:text-blue-400"
            }
        }

        if (isDirty) {
            return {
                icon: <CloudOff className="h-4 w-4" />,
                text: "Not saved", // Keep English for now - could add translation
                className: "text-amber-600 dark:text-amber-400"
            }
        }

        if (lastSaved) {
            return {
                icon: <CheckCircle className="h-4 w-4" />,
                text: formatLastSaved(lastSaved),
                className: "text-green-600 dark:text-green-400"
            }
        }

        return {
            icon: <CloudOff className="h-4 w-4" />,
            text: "Not saved", // Keep English for now - could add translation
            className: "text-amber-600 dark:text-amber-400"
        }
    }

    const status = getStatusContent()

    return (
        <div
            className={cn("flex items-center justify-between gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border", className)}
            role="region"
            aria-label="Game save status and controls"
        >
            <div
                className="flex items-center gap-2 text-sm"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                {status.icon}
                <span className={status.className}>
                    {status.text}
                </span>
            </div>

            <Button
                onClick={handleSave}
                disabled={isSaving || isLoadingState}
                size="sm"
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                aria-label={`Save game progress${isDirty ? ' (unsaved changes)' : ''} - Keyboard shortcut: ${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + S`}
                title={`Save progress (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+S)`}
            >
                <Save className="h-4 w-4 mr-1" />
                {translations.game.save}
            </Button>
        </div>
    )
}
