import { Palette, Volume2, VolumeX } from 'lucide-react'
import { type PropsWithChildren, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../features/i18n/LanguageContext'

type ThemeName = 'classic' | 'deep-sea' | 'violet-vault'

const themes: Array<{ name: ThemeName; label: string; color: string }> = [
  { name: 'classic', label: 'Block Blue', color: '#1674ad' },
  { name: 'deep-sea', label: 'Deep Sea Arcade', color: '#2f7d88' },
  { name: 'violet-vault', label: 'Violet Vault', color: '#704b91' },
]

export function AppShell({ children }: PropsWithChildren) {
  const { language, setLanguage, isThai } = useLanguage()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = window.localStorage.getItem('codesign-theme')
    if (saved === 'forest') return 'deep-sea'
    if (saved === 'sunset' || saved === 'dusk') return 'violet-vault'
    return themes.some((item) => item.name === saved)
      ? (saved as ThemeName)
      : 'classic'
  })
  const [musicEnabled, setMusicEnabled] = useState(
    () => window.localStorage.getItem('codesign-music') === 'on',
  )
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('codesign-theme', theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem('codesign-music', musicEnabled ? 'on' : 'off')
    const audio = audioRef.current
    if (!audio) return

    audio.volume = 0.14
    if (!musicEnabled) {
      audio.pause()
      return
    }

    const resume = () => {
      if (document.visibilityState === 'visible') void audio.play().catch(() => undefined)
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') audio.pause()
      else resume()
    }

    resume()
    document.addEventListener('pointerdown', resume, { once: true })
    document.addEventListener('keydown', resume, { once: true })
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('pointerdown', resume)
      document.removeEventListener('keydown', resume)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [musicEnabled])

  const toggleMusic = () => {
    const next = !musicEnabled
    setMusicEnabled(next)
    if (next && audioRef.current) {
      audioRef.current.volume = 0.14
      void audioRef.current.play().catch(() => undefined)
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {isThai ? 'ข้ามไปยังเนื้อหาหลัก' : 'Skip to main content'}
      </a>
      <header className="topbar">
        <Link className="brand" to="/" aria-label="CODESIGN home">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span className="brand-word">CODESIGN</span>
        </Link>
        <span className="creator-credit">เกมโดย ธีรภาพ ตระการผล - HR ข้างบ้าน</span>
        <div className="topbar-actions">
          <div className="language-switch" role="group" aria-label={isThai ? 'เลือกภาษา' : 'Choose language'}>
            <button type="button" aria-pressed={language === 'th'} onClick={() => setLanguage('th')}>TH</button>
            <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
          </div>
          <button
            className="sound-status"
            type="button"
            aria-pressed={musicEnabled}
            title={isThai ? 'เปิดหรือปิดเพลงประกอบ 8-bit' : 'Turn 8-bit background music on or off'}
            onClick={toggleMusic}
          >
            {musicEnabled ? <Volume2 aria-hidden="true" size={16} /> : <VolumeX aria-hidden="true" size={16} />}
            MUSIC {musicEnabled ? 'ON' : 'OFF'}
          </button>
          <div className="theme-picker">
            <button
              className="icon-button"
              type="button"
              aria-label={isThai ? 'เลือกชุดสี' : 'Choose color theme'}
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((current) => !current)}
            >
              <Palette aria-hidden="true" size={19} />
            </button>
            {pickerOpen ? (
              <div className="theme-menu" role="menu" aria-label={isThai ? 'ชุดสี' : 'Color themes'}>
                {themes.map((item) => (
                  <button
                    key={item.name}
                    className="theme-option"
                    type="button"
                    role="menuitemradio"
                    aria-checked={theme === item.name}
                    onClick={() => {
                      setTheme(item.name)
                      setPickerOpen(false)
                    }}
                  >
                    <span
                      className="theme-swatch"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <audio ref={audioRef} loop preload="none">
        <source src={`${import.meta.env.BASE_URL}audio/curious-theme.ogg`} type="audio/ogg" />
      </audio>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <span>CODESIGN v1.0</span>
        <nav aria-label="Legal">
          <Link to="/privacy">PRIVACY</Link>
          <Link to="/terms">TERMS</Link>
        </nav>
        <span className="site-footer__meta">
          <span>PROCESS, NOT A SCORE.</span>
          <span className="site-footer__separator" aria-hidden="true"> · </span>
          <span>MUSIC: EMANRESU / CC0</span>
        </span>
      </footer>
    </div>
  )
}
