'use client'
import { useActionState } from 'react'
import { saveHours } from '@/app/actions'

const DAYS = [['Monday', 1], ['Tuesday', 2], ['Wednesday', 3], ['Thursday', 4], ['Friday', 5], ['Saturday', 6], ['Sunday', 0]] as const
type Day = { dayOfWeek: number; startTime: string; endTime: string }

export default function HoursForm({ userId, hours }: { userId: number; hours: Day[] }) {
  const [state, action, pending] = useActionState(saveHours, null)
  return (
    <form action={action} className="space-y-2 pt-3">
      <input type="hidden" name="userId" value={userId} />
      {DAYS.map(([label, dow]) => {
        const h = hours.find((x) => x.dayOfWeek === dow)
        return (
          <div key={dow} className="flex items-center gap-3 text-sm">
            <label className="flex w-28 items-center gap-2"><input type="checkbox" name={`on-${dow}`} defaultChecked={!!h} className="accent-brand" />{label}</label>
            <input type="time" name={`start-${dow}`} defaultValue={h?.startTime ?? '09:00'} aria-label={`${label} start`} className="tabular rounded-md border border-line px-2 py-1" />
            <span className="text-muted">to</span>
            <input type="time" name={`end-${dow}`} defaultValue={h?.endTime ?? '18:00'} aria-label={`${label} end`} className="tabular rounded-md border border-line px-2 py-1" />
          </div>
        )
      })}
      <div className="flex items-center gap-3 pt-1">
        <button disabled={pending} className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60">{pending ? 'Saving…' : 'Save hours'}</button>
        {state?.ok && <span role="status" className="text-xs text-emerald-600">Saved</span>}
        {state && !state.ok && <span role="alert" className="text-xs text-red-600">{state.errors._}</span>}
        <span className="text-xs text-muted">Lunch 13:00–14:00 is applied automatically on full days.</span>
      </div>
    </form>
  )
}
