'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Users, Trash2, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface Usuario {
  id: string; nome: string; email: string; funcao: string; telefone: string; status: string; foto: string;
}

const funcoes = [
  { value: 'admin', label: 'Administrador' },
  { value: 'ministro', label: 'Ministro' },
  { value: 'vocal', label: 'Vocal' },
  { value: 'baixo', label: 'Baixo' },
  { value: 'bateria', label: 'Bateria' },
  { value: 'guitarra', label: 'Guitarra' },
  { value: 'violao', label: 'Violão' },
  { value: 'teclado', label: 'Teclado' },
]

const funcaoColors: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-400 border-red-500/20',
  ministro: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  vocal: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  baixo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  bateria: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  guitarra: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  violao: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  teclado: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', password: '', funcao: 'vocal', telefone: '' })

  useEffect(() => { loadUsuarios() }, [])

  async function loadUsuarios() {
    const res = await fetch('/api/usuarios')
    const data = await res.json()
    setUsuarios(Array.isArray(data) ? data : [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success('Usuário criado!')
      setDialogOpen(false)
      setForm({ nome: '', email: '', password: '', funcao: 'vocal', telefone: '' })
      loadUsuarios()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Erro ao criar usuário')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Usuário excluído!')
      loadUsuarios()
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient">Usuários</h1>
            <p className="text-muted-foreground">{usuarios.length} membros cadastrados</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={() => setDialogOpen(true)} className="gradient-purple text-white glow-purple-sm hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Novo Usuário
            </Button>
            <DialogContent className="glass-strong border-glow">
              <DialogHeader>
                <DialogTitle className="text-gradient">Novo Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nome *</Label>
                  <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="bg-background/50" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-background/50" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Senha *</Label>
                  <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="bg-background/50" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Função</Label>
                  <Select value={form.funcao} onValueChange={v => { if (v) setForm({...form, funcao: v}) }}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {funcoes.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Telefone</Label>
                  <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} className="bg-background/50" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-border/50">Cancelar</Button>
                  <Button type="submit" className="gradient-purple text-white hover:opacity-90">Criar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuarios.map(u => (
            <div key={u.id} className="glass rounded-2xl p-4 hover:glow-purple-sm transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {u.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{u.nome}</h3>
                    <Badge variant="outline" className={`text-xs mt-1 ${funcaoColors[u.funcao] || ''}`}>
                      {funcoes.find(f => f.value === u.funcao)?.label || u.funcao}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" /> {u.email}
                </div>
                {u.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" /> {u.telefone}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-3">
                <Badge variant={u.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                  {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
                <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {usuarios.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário cadastrado</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
