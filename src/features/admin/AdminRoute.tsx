import { useQuery } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { isCurrentUserAdmin } from './admin.service'

export function AdminRoute({ children }: PropsWithChildren) {
  const access = useQuery({
    queryKey: ['admin-access'],
    queryFn: isCurrentUserAdmin,
    staleTime: 60_000,
    retry: false,
  })

  if (access.isLoading) {
    return <div className="route-loading" role="status">VERIFYING ADMIN ACCESS…</div>
  }

  if (access.isError || !access.data) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
