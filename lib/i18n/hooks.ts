import { useLanguage } from './context'
import { translations } from './translations'
import type { TranslationKey } from './types'

export function useTranslation() {
  const { language } = useLanguage()

  const t = (key: TranslationKey): string => {
    return key[language]
  }

  // Helper function to get nested translation keys
  const getTranslations = () => translations

  return { t, translations: getTranslations(), language }
}

// Utility function for getting translations without hook (for server-side or non-component usage)
export function getTranslation(key: TranslationKey, language: 'en' | 'sv' = 'en'): string {
  return key[language]
}
