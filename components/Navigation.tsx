'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Package, UtensilsCrossed, Camera, ShoppingCart, User } from 'lucide-react'

const nav = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/plan', label: 'Plan', icon: UtensilsCrossed },
  { href: '/scanner', label: 'Escáner', icon: Camera },
  { href: '/compras', label: 'Compras', icon: ShoppingCart },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-zinc-100 px-4 py-8">
        <div className="mb-10 px-2">
          <span className="text-2xl font-bold text-emerald-600 tracking-tight">OptiFud</span>
          <p className="text-xs text-zinc-400 mt-0.5">Nutrición inteligente</p>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 flex z-50">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              pathname === href ? 'text-emerald-600' : 'text-zinc-400'
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
