import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthListener } from './hooks/useAuth'
import Navbar from './components/layout/Navbar'
import PageTransition from './components/layout/PageTransition'
import SplashScreen from './components/ui/SplashScreen'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Album from './pages/Album'
import Timeline from './pages/Timeline'
import Calendar from './pages/Calendar'
import Login from './pages/Login'
import Favorites from './pages/Favorites'
import FamilyMembers from './pages/FamilyMembers'
import UploadModalHost from './components/layout/UploadModalHost'

function AppRoutes() {
  useAuthListener()
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-dark">
      {!isLogin && <Navbar />}
      <UploadModalHost />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/gallery"
            element={
              <PageTransition>
                <Gallery />
              </PageTransition>
            }
          />
          <Route
            path="/albums"
            element={
              <PageTransition>
                <Album />
              </PageTransition>
            }
          />
          <Route
            path="/album/:id"
            element={
              <PageTransition>
                <Album />
              </PageTransition>
            }
          />
          <Route
            path="/favorites"
            element={
              <PageTransition>
                <Favorites />
              </PageTransition>
            }
          />
          <Route
            path="/timeline"
            element={
              <PageTransition>
                <Timeline />
              </PageTransition>
            }
          />
          <Route
            path="/calendar"
            element={
              <PageTransition>
                <Calendar />
              </PageTransition>
            }
          />
          <Route
            path="/members"
            element={
              <PageTransition>
                <FamilyMembers />
              </PageTransition>
            }
          />
          <Route
            path="/login"
            element={
              <PageTransition>
                <Login />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    const seen = sessionStorage.getItem('splash_seen')
    if (seen) return false
    sessionStorage.setItem('splash_seen', 'true')
    return true
  })

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  )
}
