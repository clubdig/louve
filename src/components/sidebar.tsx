'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Music, Calendar, Users, LayoutList,
  BarChart3, Settings, LogOut, Menu, X, Home
} from 'lucide-react'
import { useState, useEffect } from 'react'

const adminItems = [
  { href: '/', label: 'Painel', icon: Home },
  { href: '/musicas', label: 'Músicas', icon: Music },
  { href: '/cultos', label: 'Cultos', icon: Calendar },
  { href: '/escalas', label: 'Escalas', icon: LayoutList },
  { href: '/usuarios', label: 'Usuários', icon: Users },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

const musicoItems = [
  { href: '/', label: 'Painel', icon: Home },
  { href: '/cultos', label: 'Cultos', icon: Calendar },
  { href: '/escalas', label: 'Escalas', icon: LayoutList },
]

function getUserFuncao(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const user = JSON.parse(raw)
    return user.funcao || null
  } catch {
    return null
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [funcao, setFuncao] = useState<string | null>(null)

  useEffect(() => {
    setFuncao(getUserFuncao())
  }, [])

  const navItems = funcao === 'admin' ? adminItems : musicoItems

  async function handleLogout() {
    localStorage.removeItem('user')
    window.location.href = '/api/auth/logout'
  }

  const nav = (
    <nav className="flex flex-col h-full">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center shrink-0 glow-purple-sm">
            <span className="text-white text-sm font-bold">L</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gradient">Louve</h1>
            <p className="text-[11px] text-muted-foreground">Gestão do Louvor</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'gradient-purple-subtle text-purple-300 border-glow glow-purple-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="p-3 border-t border-border/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sair
        </button>
      </div>
    </nav>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 p-2.5 glass rounded-xl border-glow shadow-lg md:hidden"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-full w-64 glass-strong border-r border-border/50 transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0'
        )}
      >
        {nav}
      </aside>
    </>
  )
}
