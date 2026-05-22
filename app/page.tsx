import Link from 'next/link'

export default function Home() {
  return (
    <div className="py-12">
      <header className="pt-12 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold">Client Account Risk Alerts for Agencies</h1>
        <p className="mt-4 text-zinc-300 max-w-2xl mx-auto">
          Identify at-risk client accounts, prioritize outreach, and reduce churn with clear, actionable alerts.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dashboard" className="inline-block px-5 py-2 bg-zinc-800 text-zinc-50 rounded-md">
            Get started — Dashboard
          </Link>
          <a href="#how" className="inline-block px-5 py-2 border border-zinc-800 text-zinc-300 rounded-md">
            How it works
          </a>
        </div>
      </header>

      <section className="mt-12 max-w-5xl mx-auto px-4">
        <div className="prose prose-invert mx-auto">
          <h2 className="text-2xl font-medium">The problem</h2>
          <p className="text-zinc-300">Agencies managing multiple clients often miss early warning signs of account deterioration. Small issues compound into churn and lost revenue because signals are scattered and hard to prioritize.</p>
        </div>

        <div id="how" className="mt-10">
          <h3 className="text-xl font-medium">How it works</h3>
          <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="p-4 border border-zinc-800 rounded">
              <h4 className="font-medium">1. Collect</h4>
              <p className="text-zinc-300 mt-2">Aggregate signals from accounts and integrations into a single view.</p>
            </div>
            <div className="p-4 border border-zinc-800 rounded">
              <h4 className="font-medium">2. Analyze</h4>
              <p className="text-zinc-300 mt-2">Score account health using simple, transparent rules and thresholds.</p>
            </div>
            <div className="p-4 border border-zinc-800 rounded">
              <h4 className="font-medium">3. Alert</h4>
              <p className="text-zinc-300 mt-2">Surface prioritized alerts with recommended next steps for retention.</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/dashboard" className="inline-block px-6 py-3 bg-zinc-800 text-zinc-50 rounded-md">
            Try the dashboard
          </Link>
        </div>
      </section>

      <footer className="mt-16 border-t border-zinc-800 pt-8">
        <div className="max-w-5xl mx-auto px-4 text-sm text-zinc-400 text-center">
          <p>© {new Date().getFullYear()} RiskAlerts — Built for agencies.</p>
        </div>
      </footer>
    </div>
  )
}
