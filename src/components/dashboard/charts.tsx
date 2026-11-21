'use client'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const axis = { fontSize: 11, fill: '#64748b' }
const tip = { contentStyle: { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 } }

export function RevenueChart({ data }: { data: { date: string; revenue: number; bookings: number }[] }) {
  return (
    <div className="h-64" role="img" aria-label="Revenue and bookings over the last 30 days">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={axis} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip {...tip} formatter={(v, k) => (k === 'revenue' ? [`$${v}`, 'Revenue'] : [v, 'Bookings'])} />
          <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#rev)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PopularChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="h-64" role="img" aria-label="Most popular services">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={130} tick={axis} tickLine={false} axisLine={false} />
          <Tooltip {...tip} cursor={{ fill: '#f1f5f9' }} />
          <Bar dataKey="count" name="Bookings" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
