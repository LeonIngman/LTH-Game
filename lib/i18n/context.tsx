"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import type { Language } from './types'

interface LanguageContextType {
    language: Language
    setLanguage: (language: Language) => void
    toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
    children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [language, setLanguageState] = useState<Language>('en')

    // Load language from localStorage on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') as Language
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'sv')) {
            setLanguageState(savedLanguage)
        }
    }, [])

    // Save language to localStorage when it changes
    const setLanguage = (newLanguage: Language) => {
        setLanguageState(newLanguage)
        localStorage.setItem('language', newLanguage)
    }

    const toggleLanguage = () => {
        const newLanguage = language === 'en' ? 'sv' : 'en'
        setLanguage(newLanguage)
    }

    const value = useMemo(() => ({
        language,
        setLanguage,
        toggleLanguage
    }), [language])

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
