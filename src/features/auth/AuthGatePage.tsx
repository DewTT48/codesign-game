import { ArrowLeft, LockKeyhole, Mail } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import { useLanguage } from '../i18n/LanguageContext'
import { useAuth } from './AuthContext'

export function AuthGatePage() {
  const { isThai } = useLanguage()
  const auth = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [startingGoogle, setStartingGoogle] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  async function handleGoogleSignIn() {
    setStartingGoogle(true)
    setError(null)
    try {
      await auth.signInWithGoogle('/dashboard')
    } catch {
      setError(isThai ? 'เริ่ม Google Sign-in ไม่สำเร็จ กรุณาลองใหม่' : 'Could not start Google sign-in. Please try again.')
      setStartingGoogle(false)
    }
  }

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSendingEmail(true)
    setError(null)
    setEmailSent(false)
    try {
      await auth.signInWithEmail(email, '/dashboard')
      setEmailSent(true)
    } catch {
      setError(isThai ? 'ส่งลิงก์เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลแล้วลองใหม่' : 'Could not send the sign-in link. Check your email address and try again.')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="auth-page content-page">
      <Link className="back-link" to="/mission">
        <ArrowLeft aria-hidden="true" size={18} /> MISSION BRIEF
      </Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-lock" aria-hidden="true">
          <LockKeyhole size={34} />
        </div>
        <span className="chapter-code">AUTH GATE</span>
        <h1 id="auth-title">SAVE YOUR MISSION</h1>
        <p>
          {isThai ? 'ตั้งแต่ C — Context เป็นต้นไป การคิด การตัดสินใจ PRD และ Journal ของคุณจะถูกบันทึกอย่างเป็นส่วนตัว' : 'From C — Context onward, your thinking, decisions, PRD, and Journal are saved privately.'}
        </p>
        <ArcadeButton
          type="button"
          disabled={!auth.configured || startingGoogle || sendingEmail}
          aria-disabled={!auth.configured || startingGoogle || sendingEmail}
          onClick={() => void handleGoogleSignIn()}
        >
          {startingGoogle ? 'OPENING GOOGLE…' : 'CONTINUE WITH GOOGLE'}
        </ArcadeButton>
        <div className="auth-divider" aria-hidden="true"><span>OR</span></div>
        <form className="auth-email-form" onSubmit={(event) => void handleEmailSignIn(event)}>
          <label htmlFor="auth-email">{isThai ? 'เข้าสู่ระบบด้วยอีเมล' : 'SIGN IN WITH EMAIL'}</label>
          <div className="auth-email-form__row">
            <div className="auth-email-input">
              <Mail aria-hidden="true" size={19} />
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setEmailSent(false)
                }}
                required
              />
            </div>
            <ArcadeButton type="submit" variant="secondary" disabled={!auth.configured || startingGoogle || sendingEmail || !email.trim()}>
              {sendingEmail ? 'SENDING…' : 'SEND MAGIC LINK'}
            </ArcadeButton>
          </div>
          <small>{isThai ? 'ไม่ต้องใช้ Google และไม่ต้องตั้งรหัสผ่าน เราจะส่งลิงก์เข้าใช้ครั้งเดียวไปทางอีเมล' : 'No Google account or password required. We will email you a one-time sign-in link.'}</small>
        </form>
        {emailSent ? (
          <div className="auth-success" role="status">
            <strong>CHECK YOUR EMAIL</strong>
            <span>{isThai ? `ส่งลิงก์ไปที่ ${email.trim()} แล้ว` : `We sent a sign-in link to ${email.trim()}.`}</span>
          </div>
        ) : null}
        {error ? <span className="auth-error" role="alert">{error}</span> : null}
        <span className="auth-status">
          {auth.configured
            ? 'SUPABASE READY — PRIVATE BY DEFAULT'
            : 'LOCAL PREVIEW — ADD SUPABASE ENVIRONMENT TO ENABLE SIGN-IN'}
        </span>
      </section>
    </div>
  )
}
