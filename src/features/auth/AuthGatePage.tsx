import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArcadeButton } from '../../components/ui/ArcadeButton'
import { useAuth } from './AuthContext'

export function AuthGatePage() {
  const auth = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  async function handleGoogleSignIn() {
    setStarting(true)
    setError(null)
    try {
      await auth.signInWithGoogle('/dashboard')
    } catch {
      setError('เริ่ม Google Sign-in ไม่สำเร็จ กรุณาลองใหม่')
      setStarting(false)
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
          ตั้งแต่ C — Context เป็นต้นไป การคิด การตัดสินใจ PRD และ Journal
          ของคุณจะถูกบันทึกอย่างเป็นส่วนตัว
        </p>
        <ArcadeButton
          disabled={!auth.configured || starting}
          aria-disabled={!auth.configured || starting}
          onClick={() => void handleGoogleSignIn()}
        >
          {starting ? 'OPENING GOOGLE…' : 'CONTINUE WITH GOOGLE'}
        </ArcadeButton>
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
