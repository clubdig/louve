'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  admin: 'bg-red-100 text-red-800',
  ministro: 'bg-purple-100 text-purple-800',
  vocal: 'bg-blue-100 text-blue-800',
  baixo: 'bg-green-100 text-green-800',
  bateria: 'bg-orange-100 text-orange-800',
  guitarra: 'bg-yellow-100 text-yellow-800',
  violao: 'bg-teal-100 text-teal-800',
  teclado: 'bg-pink-100 text-pink-800',
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
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground">{usuarios.length} membros cadastrados</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Button><Plus className="w-4 h-4 mr-2" /> Novo Usuário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Senha *</Label>
                  <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select value={form.funcao} onValueChange={v => { if (v) setForm({...form, funcao: v}) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {funcoes.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Criar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuarios.map(u => (
            <Card key={u.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                      {u.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{u.nome}</CardTitle>
                      <Badge className={funcaoColors[u.funcao] || 'bg-gray-100'}>
                        {funcoes.find(f => f.value === u.funcao)?.label || u.funcao}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" /> {u.email}
                </div>
                {u.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" /> {u.telefone}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Badge variant={u.status === 'ativo' ? 'default' : 'secondary'}>
                    {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={() => handleDelete(u.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usuarios.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário cadastrado</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
