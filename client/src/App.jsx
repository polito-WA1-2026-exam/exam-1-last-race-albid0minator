import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getCurrentSession, logout } from './API.js'
import Navigation from './components/Navigation.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import GamePage from './pages/GamePage.jsx'
import RankingPage from './pages/RankingPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bootstrapError, setBootstrapError] = useState(null)

  const bootstrapSession = async () => {
    setLoading(true)
    setBootstrapError(null)
    try {
      const session = await getCurrentSession()
      setUser(session?.user ?? null)
    } catch (err) {
      setUser(null)
      setBootstrapError(err.message ?? 'Impossibile contattare il server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const session = await getCurrentSession()
        if (!cancelled) setUser(session?.user ?? null)
      } catch (err) {
        if (!cancelled) {
          setUser(null)
          setBootstrapError(err.message ?? 'Impossibile contattare il server.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      /* Server non raggiungibile: esci comunque lato client */
    } finally {
      setUser(null)
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5 text-muted">
        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
        Caricamento sessione…
      </div>
    )
  }

  if (bootstrapError) {
    return (
      <div className="container py-5 text-center" style={{ maxWidth: 480 }}>
        <div className="alert alert-danger mb-3">{bootstrapError}</div>
        <button type="button" className="btn btn-primary" onClick={() => void bootstrapSession()}>
          Riprova
        </button>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Navigation user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage user={user} />} />
        <Route path="/login" element={<LoginPage onLogin={setUser} user={user} />} />
        <Route
          path="/events"
          element={
            <ProtectedRoute user={user}>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game"
          element={
            <ProtectedRoute user={user}>
              <GamePage user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ranking"
          element={
            <ProtectedRoute user={user}>
              <RankingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute user={user}>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
