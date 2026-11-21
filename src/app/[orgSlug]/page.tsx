import { notFound } from 'next/navigation'
import BookingWidget from '@/components/booking-widget'
import { getOrgBySlug } from '@/lib/booking'

export default async function PublicBooking({ params }: PageProps<'/[orgSlug]'>) {
  const data = await getOrgBySlug((await params).orgSlug)
  if (!data) notFound()
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Book an appointment</h1>
      <p className="mb-6 text-sm text-muted">Pick a service, a day and a time. Payment is a demo (no real charge).</p>
      <BookingWidget org={data.org} services={data.services} staff={data.staff} />
    </main>
  )
}
