import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="hidden md:block w-64 border-r border-zinc-800 p-4">
      <div className="mb-6">
        <div className="text-lg font-medium">RiskAlerts</div>
        <div className="text-xs text-zinc-500">Agency dashboard</div>
      </div>

      <nav className="flex flex-col gap-2" aria-label="Sidebar navigation">
        <Link href="/dashboard" className="text-zinc-300 hover:text-zinc-50">Dashboard</Link>
        <Link href="/clients" className="text-zinc-300 hover:text-zinc-50">Clients</Link>
        <Link href="/alerts" className="text-zinc-300 hover:text-zinc-50">Alerts</Link>
        <Link href="/settings" className="text-zinc-300 hover:text-zinc-50">Settings</Link>
      </nav>
    </aside>
  )
}
