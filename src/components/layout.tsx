import { useState } from 'react'

import { Console } from '@/components/Console'
import { Sidebar } from '@/components/sidebar'
import { TopNavbar } from '@/components/top-navbar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)
  const [consoleHeight, setConsoleHeight] = useState(300)

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
