import { Palette, Volume2 } from 'lucide-react'
import { type PropsWithChildren, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type ThemeName = 'classic' | 'forest' | 'sunset'

const themes: Array<{ name: ThemeName; label: string; color: string }> = [
  { name: 'classic', label: 'Block blue', color: '#1674ad' },
  { name: 'forest', label: 'Forest quest', color: '#89c64f' },
  { name: 'sunset', label: 'Sunset arcade', color: '#ff5c8a' },
]

export function AppShell({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = window.localStorage.getItem('codesign-theme')
    return themes.some((item) => item.name === saved)
      ? (saved as ThemeName)
      : 'classic'
  })
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('codesign-theme', theme)
  }, [theme])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <header className="topbar">
        <Link className="brand" to="/" aria-label="CODESIGN home">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span className="brand-word">CODESIGN</span>
        </Link>
        <div className="topbar-actions">
          <span className="sound-status" title="Sound effects are off">
            <Volume2 aria-hidden="true" size={16} /> SOUND OFF
          </span>
          <div className="theme-picker">
            <button
              className="icon-button"
              type="button"
              aria-label="เลือกชุดสี"
              aria-expanded={pickerOpen}
              onClick={() => setPickerOpen((current) => !current)}
            >
              <Palette aria-hidden="true" size={19} />
            </button>
            {pickerOpen ? (
              <div className="theme-menu" role="menu" aria-label="ชุดสี">
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
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <span>CODESIGN v1.0</span>
        <span>PROCESS, NOT A SCORE.</span>
      </footer>
    </div>
  )
}
