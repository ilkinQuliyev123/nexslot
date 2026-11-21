import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="tabular text-5xl font-bold text-brand">404</p>
      <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted">This booking page or reference does not exist.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">Back to home</Link>
    </main>
  )
}
