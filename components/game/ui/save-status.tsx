"use client"

import { CheckCircle, AlertCircle, Loader2, Cloud, CloudOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface SaveStatusProps {
    isSaving: boolean
    lastSaved: Date | null
    isLoadingState: boolean
    className?: string
}

export function SaveStatus({ isSaving, lastSaved, isLoadingState, className }: SaveStatusProps) {
    const formatLastSaved = (date: Date) => {
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) {
            return "just now"
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)}m ago`
        } else {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    }

    if (isLoadingState) {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading progress...</span>
            </div>
        )
    }

    if (isSaving) {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-blue-600", className)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
            </div>
        )
    }

    if (lastSaved) {
        return (
            <div className={cn("flex items-center gap-2 text-sm text-green-600", className)}>
                <CheckCircle className="h-4 w-4" />
                <span>Saved {formatLastSaved(lastSaved)}</span>
            </div>
        )
    }

    return (
        <div className={cn("flex items-center gap-2 text-sm text-amber-600", className)}>
            <CloudOff className="h-4 w-4" />
            <span>Not saved</span>
        </div>
    )
}
