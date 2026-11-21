'use client'
import { Pencil, Plus } from 'lucide-react'
import { useActionState, useEffect, useRef } from 'react'
import { saveService } from '@/app/actions'

type Service = { id: number; title: string; description: string; durationMin: number; priceCents: number }
const input = 'mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'

export default function ServiceDialog({ service }: { service?: Service }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const [state, action, pending] = useActionState(saveService, null)
  const err = (k: string) => (state && !state.ok && state.errors[k] ? <p role="alert" className="mt-1 text-xs text-red-600">{state.errors[k]}</p> : null)

  useEffect(() => {
    if (state?.ok) { dialog.current?.close(); if (!service) form.current?.reset() }
  }, [state, service])

  return (
    <>
      <button onClick={() => dialog.current?.showModal()} className={service ? 'rounded-md border border-line p-1.5 text-muted hover:text-brand' : 'inline-flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-hover'} aria-label={service ? `Edit ${service.title}` : 'New service'}>
        {service ? <Pencil className="size-3.5" /> : <><Plus className="size-4" /> New service</>}
      </button>
      <dialog ref={dialog} className="m-auto w-[min(92vw,440px)] rounded-2xl border border-line p-0 backdrop:bg-slate-900/40">
        <form ref={form} action={action} className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">{service ? 'Edit service' : 'New service'}</h2>
          {service && <input type="hidden" name="id" value={service.id} />}
          <label className="block text-xs font-medium text-muted">Title<input name="title" defaultValue={service?.title} className={input} />{err('title')}</label>
          <label className="block text-xs font-medium text-muted">Description<textarea name="description" defaultValue={service?.description} rows={2} className={input} />{err('description')}</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-muted">Duration
              <select name="durationMin" defaultValue={service?.durationMin ?? 30} className={input}>{[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}</select>{err('durationMin')}
            </label>
            <label className="block text-xs font-medium text-muted">Price (USD)<input name="price" type="number" step="0.01" min="0" defaultValue={service ? service.priceCents / 100 : ''} className={input} />{err('price')}</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => dialog.current?.close()} className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-canvas">Cancel</button>
            <button disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60">{pending ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </dialog>
    </>
  )
}
