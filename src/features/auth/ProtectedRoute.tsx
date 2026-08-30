import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.loading) {
    return (
      <div className="route-loading" role="status">
        <span className="loading-pixel" aria-hidden="true" /> RESTORING MISSION…
      </div>
    )
  }

  if (!auth.user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return children
}
