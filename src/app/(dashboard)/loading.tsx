export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2"><div className="skeleton h-8 w-48" /><div className="skeleton h-4 w-72" /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-28" />)}</div>
      <div className="skeleton h-64" />
    </div>
  )
}
