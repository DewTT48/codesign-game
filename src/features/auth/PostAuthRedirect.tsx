import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function PostAuthRedirect() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.user || location.pathname !== '/') return
    const returnTo = window.sessionStorage.getItem('codesign-auth-return-to')
    if (!returnTo) return
    window.sessionStorage.removeItem('codesign-auth-return-to')
    navigate(returnTo, { replace: true })
  }, [auth.user, location.pathname, navigate])

  return null
}
