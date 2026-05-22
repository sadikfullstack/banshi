import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-lg font-medium">Brand</div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-zinc-300">Pricing</a>
          <a href="#" className="text-zinc-300">Docs</a>
          <Link href="/dashboard" className="px-3 py-1 bg-zinc-800 rounded text-zinc-50">Dashboard</Link>
        </div>
      </div>
    </nav>
  )
}
