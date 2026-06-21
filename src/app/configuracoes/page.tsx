'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-2xl">
                    {user.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user.nome}</h3>
                    <Badge>{funcaoLabels[user.funcao] || user.funcao}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
                </div>
                <Button onClick={handleSave}>Salvar Alterações</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
