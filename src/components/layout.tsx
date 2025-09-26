import { useState } from 'react'

import { Console } from '@/components/Console'
import { Sidebar } from '@/components/sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { usePersistentDatabase } from '@/hooks/usePersistentDatabase'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)
  const [consoleHeight, setConsoleHeight] = useState(300)
  
  // Initialize persistent database
  const { isInitializing, error: dbError } = usePersistentDatabase()

  const toggleConsole = () => {
    setIsConsoleOpen(!isConsoleOpen)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavbar
          onToggleConsole={toggleConsole}
          isConsoleOpen={isConsoleOpen}
        />

        {/* Page Content */}
        <main
          className="flex-1 overflow-auto p-6"
          style={{
            height: isConsoleOpen
              ? `calc(100vh - 4rem - ${consoleHeight}px)`
              : 'calc(100vh - 4rem)',
          }}
        >
          {/* Database initialization status */}
          {isInitializing && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              🗄️ Initializing persistent database...
            </div>
          )}
          {dbError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              <div className="mb-2">
                ❌ Database initialization failed: {dbError.message}
              </div>
              {dbError.message.includes('not a valid DuckDB database file') && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs">
                    This usually happens when the database schema changes during development.
                  </p>
                          <div className="mt-2 space-x-2">
                            <button
                              onClick={() => {
                                // Try automatic recovery first
                                if (typeof window !== 'undefined' && (window as any).ANTStatisticsUtils) {
                                  ;(window as any).ANTStatisticsUtils.recoverFromCorruption()
                                } else {
                                  alert('Please open browser console and run: ANTStatisticsUtils.recoverFromCorruption()')
                                }
                              }}
                              className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                            >
                              Auto Recover Database
                            </button>
                            <button
                              onClick={() => {
                                // Manual clear as fallback
                                if (typeof window !== 'undefined' && (window as any).ANTStatisticsUtils) {
                                  ;(window as any).ANTStatisticsUtils.clearCorruptedDatabase()
                                } else {
                                  alert('Please open browser console and run: ANTStatisticsUtils.clearCorruptedDatabase()')
                                }
                              }}
                              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                            >
                              Manual Clear
                            </button>
                          </div>
                </div>
              )}
            </div>
          )}
          {children}
        </main>

        {/* Console Panel */}
        <Console
          isOpen={isConsoleOpen}
          onToggle={toggleConsole}
          height={consoleHeight}
          onHeightChange={setConsoleHeight}
        />
      </div>
    </div>
  )
}
