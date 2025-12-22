/**
 * Home Page
 *
 * Landing page with:
 * - Dark mode toggle
 * - API status check
 * - Links to example pages
 * - Getting started instructions
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useTheme } from '@/components/ThemeProvider'
import { apiClient } from '@/lib/api-client'

export function Home() {
  const { theme, setTheme } = useTheme()
  const [apiStatus, setApiStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Test API connection
    apiClient
      .get('/api/status')
      .then((data) => {
        setApiStatus(data.status)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('API connection failed:', error)
        setApiStatus('error')
        setIsLoading(false)
      })
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Cloudflare Full-Stack Scaffold</h1>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
        </header>

        {/* API Status */}
        <div className="mb-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">API Status</h2>
          {isLoading ? (
            <p className="text-gray-600 dark:text-gray-400">Checking connection...</p>
          ) : apiStatus === 'ok' ? (
            <p className="text-green-600 dark:text-green-400">✅ Backend connected</p>
          ) : (
            <p className="text-red-600 dark:text-red-400">❌ Backend connection failed</p>
          )}
        </div>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Included Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              title="Workers AI"
              description="Built-in AI models for chat, generation, embeddings"
              route="/api/ai"
            />
            <FeatureCard
              title="D1 Database"
              description="SQLite database with typed query helpers"
              route="/api/d1"
            />
            <FeatureCard
              title="KV Storage"
              description="Key-value storage with TTL support"
              route="/api/kv"
            />
            <FeatureCard
              title="R2 Storage"
              description="Object storage (S3-compatible)"
              route="/api/r2"
            />
            <FeatureCard
              title="Vectorize"
              description="Vector database for semantic search and RAG"
              route="/api/vectorize"
            />
            <FeatureCard
              title="Queues"
              description="Message queues for async processing"
              route="/api/queues"
            />
          </div>
        </section>

        {/* Example Pages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Example Pages</h2>
          <div className="space-y-2">
            <Link
              to="/dashboard"
              className="block p-4 rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <h3 className="font-semibold">Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Example page with D1, KV, and API calls
              </p>
            </Link>

            {/* AI CHAT START
            <Link
              to="/chat"
              className="block p-4 rounded-lg bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
            >
              <h3 className="font-semibold">AI Chat (Disabled)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Run `npm run enable-ai-chat` to enable
              </p>
            </Link>
            AI CHAT END */}
          </div>
        </section>

        {/* Getting Started */}
        <section className="p-6 rounded-lg bg-gray-100 dark:bg-gray-800">
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <div className="space-y-4">
            <Step
              number="1"
              title="Configure Services"
              description="Edit wrangler.jsonc to add your Cloudflare service bindings"
            />
            <Step
              number="2"
              title="Initialize Database"
              description="Run: npm run d1:migrate:local"
            />
            <Step
              number="3"
              title="Optional: Enable Auth"
              description="Run: npm run enable-auth (requires Clerk account)"
            />
            <Step
              number="4"
              title="Optional: Enable AI Chat"
              description="Run: npm run enable-ai-chat"
            />
            <Step
              number="5"
              title="Deploy"
              description="Run: npm run deploy"
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  route,
}: {
  title: string
  description: string
  route: string
}) {
  return (
    <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{description}</p>
      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
        {route}
      </code>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  )
}
