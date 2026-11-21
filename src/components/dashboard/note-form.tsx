'use client'
import { useActionState, useEffect, useRef } from 'react'
import { addNote } from '@/app/actions'

export default function NoteForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(addNote, null)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => { if (state?.ok) ref.current?.reset() }, [state])
  return (
    <form ref={ref} action={action} className="mt-2 flex gap-2">
      <input type="hidden" name="email" value={email} />
      <input name="note" placeholder="Add a private note…" aria-label={`Note for ${email}`} className="min-w-0 flex-1 rounded-lg border border-line px-3 py-1.5 text-xs outline-none focus:border-brand" />
      <button disabled={pending} className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:border-brand hover:text-brand disabled:opacity-60">Add</button>
      {state && !state.ok && <span role="alert" className="self-center text-xs text-red-600">{state.errors.note}</span>}
    </form>
  )
}
