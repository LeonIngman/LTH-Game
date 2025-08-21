import { useLanguage } from './context'
import { translations } from './translations'
import type { TranslationKey } from './types'

export function useTranslation() {
  const { language } = useLanguage()

  const t = (key: TranslationKey): string => {
    return key[language]
  }

  // Helper to get translated values from the translations object
  const getTranslatedObject = (obj: any): any => {
    if (!obj) return obj
    
    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && 'en' in value && 'sv' in value) {
        // This is a translation key
        result[key] = (value as TranslationKey)[language]
      } else if (value && typeof value === 'object') {
        // This is a nested object, recurse
        result[key] = getTranslatedObject(value)
      } else {
        result[key] = value
      }
    }
    return result
  }

  return { 
    t, 
    translations: getTranslatedObject(translations), 
    language 
  }
}

// Utility function for getting translations without hook (for server-side or non-component usage)
export function getTranslation(key: TranslationKey, language: 'en' | 'sv' = 'en'): string {
  return key[language]
}
