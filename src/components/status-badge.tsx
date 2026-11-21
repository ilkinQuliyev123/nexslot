import type { Status } from '@/db/schema'
import { statusStyle } from '@/lib/format'

export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusStyle[status]}`}>{status}</span>
}
