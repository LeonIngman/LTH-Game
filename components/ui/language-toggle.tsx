"use client"

import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage, useTranslation } from "@/lib/i18n"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const { t, translations } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={`cursor-pointer ${language === 'en' ? 'bg-accent' : ''}`}
        >
          🇺🇸 {t(translations.common.english)}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('sv')}
          className={`cursor-pointer ${language === 'sv' ? 'bg-accent' : ''}`}
        >
          🇸🇪 {t(translations.common.swedish)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
