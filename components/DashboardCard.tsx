import type { PropsWithChildren } from 'react'

type DashboardCardProps = {
  title: string
  value: string | number
  subtitle?: string
}

export default function DashboardCard({ title, value, subtitle }: DashboardCardProps) {
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>}
    </div>
  )
}
