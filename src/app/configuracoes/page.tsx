'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function ConfiguracoesPage() {
  const [user, setUser] = useState<{ userId: string; nome: string; email: string; funcao: string } | null>(null)
  const [form, setForm] = useState({ nome: '', telefone: '' })

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}')
    if (stored.nome) {
      setUser(stored)
      setForm({ nome: stored.nome, telefone: stored.telefone || '' })
    }
  }, [])

  async function handleSave() {
    if (!user) return
    const res = await fetch(`/api/usuarios/${user.userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Perfil atualizado!')
      localStorage.setItem('user', JSON.stringify({ ...user, ...form }))
    }
  }

  const funcaoLabels: Record<string, string> = {
    admin: 'Administrador', ministro: 'Ministro', vocal: 'Vocal',
    baixo: 'Baixo', bateria: 'Bateria', guitarra: 'Guitarra',
    violao: 'Violão', teclado: 'Teclado',
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil</p>
        </div>

        <div className="glass rounded-2xl p-6 glow-purple">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4"><Settings className="w-5 h-5 text-purple-400" /> Meu Perfil</h3>
          {user && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl gradient-purple flex items-center justify-center text-white font-bold text-2xl glow-purple-sm">
                  {user.nome?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.nome}</h3>
                  <Badge variant="outline" className="mt-1">{funcaoLabels[user.funcao] || user.funcao}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nome</Label>
                <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <Input value={user.email} disabled className="bg-background/30" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className="bg-background/50" />
              </div>
              <Button onClick={handleSave} className="gradient-purple text-white hover:opacity-90 glow-purple-sm">Salvar Alterações</Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
