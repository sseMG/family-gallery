import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthListener } from './hooks/useAuth'
import Navbar from './components/layout/Navbar'
import PageTransition from './components/layout/PageTransition'
import Home from './pages/Home'
import Gallery from './pages/Gallery'
import Album from './pages/Album'
import Timeline from './pages/Timeline'
import Login from './pages/Login'
import Favorites from './pages/Favorites'
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
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
