import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NexSlot — Booking & analytics for service businesses',
  description: 'Multi-tenant booking, scheduling and analytics SaaS. Portfolio demo built with Next.js, TypeScript, Tailwind CSS and Drizzle ORM.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} antialiased`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
