import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type AppLanguage = 'th' | 'en'

type LanguageContextValue = {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  isThai: boolean
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = window.localStorage.getItem('codesign-language')
    return saved === 'en' ? 'en' : 'th'
  })

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem('codesign-language', language)
  }, [language])

  const value = useMemo(
    () => ({ language, setLanguage, isThai: language === 'th' }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
