import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OptiFud – Nutrición inteligente',
  description: 'Gestión de stock, plan de alimentación y macros personalizados',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-50 flex">
        <Navigation />
        <main className="flex-1 min-h-screen pb-20 md:pb-0 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  )
}
