import Sidebar from './Sidebar'
import type { PropsWithChildren } from 'react'

export default function DashboardShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
