import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthGatePage } from './features/auth/AuthGatePage'
import { PostAuthRedirect } from './features/auth/PostAuthRedirect'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LandingPage } from './features/landing/LandingPage'
import { MissionBriefPage } from './features/mission/MissionBriefPage'
import { CreateProjectPage } from './features/projects/CreateProjectPage'
import { ProjectWorkspacePage } from './features/journey/ProjectWorkspacePage'
import { PrivacyPage, TermsPage } from './features/legal/LegalPages'
import { ScrollToTop } from './components/navigation/ScrollToTop'

export default function App() {
  return (
    <AppShell>
      <PostAuthRedirect />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/mission" element={<MissionBriefPage />} />
        <Route path="/auth" element={<AuthGatePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <CreateProjectPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/:phase?"
          element={
            <ProtectedRoute>
              <ProjectWorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
