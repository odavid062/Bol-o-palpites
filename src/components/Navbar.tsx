'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = { isAdmin: boolean; nome: string }

export default function Navbar({ isAdmin, nome }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/palpites', label: '⚽ Palpites' },
    { href: '/ranking', label: '🏆 Ranking' },
    { href: '/resultados', label: '📊 Resultados' },
    ...(isAdmin ? [{ href: '/admin', label: '⚙️ Admin' }] : []),
  ]

  return (
    <nav className="bg-green-800 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg">⚽ Bolão 2026</span>
        <div className="flex items-center gap-2 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === l.href
                  ? 'bg-green-600'
                  : 'hover:bg-green-700'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <span className="text-green-300 text-xs ml-2 hidden sm:block">{nome}</span>
          <button
            onClick={logout}
            className="text-xs text-green-300 hover:text-white ml-1"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
