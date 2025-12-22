/**
 * App Root Component
 *
 * Sets up:
 * - ThemeProvider for dark mode
 * - React Router for navigation
 * - Optional Clerk authentication (commented by default)
 */

import { BrowserRouter, Routes, Route } from 'react-router'
import { ThemeProvider } from '@/components/ThemeProvider'
/* CLERK AUTH START
import { ClerkProvider } from '@clerk/clerk-react'
CLERK AUTH END */

// Pages
import { Home } from '@/pages/Home'
import { Dashboard } from '@/pages/Dashboard'
import { Profile } from '@/pages/Profile'
/* AI CHAT START
import { Chat } from '@/pages/Chat'
AI CHAT END */

/* CLERK AUTH START
// Get Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn('Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY in .env')
}
CLERK AUTH END */

function App() {
  return (
    /* CLERK AUTH START
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    CLERK AUTH END */
      <ThemeProvider defaultTheme="system">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            {/* AI CHAT START
            <Route path="/chat" element={<Chat />} />
            AI CHAT END */}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    /* CLERK AUTH START
    </ClerkProvider>
    CLERK AUTH END */
  )
}

export default App
