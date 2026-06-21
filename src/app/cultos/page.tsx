'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Calendar, Music, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Musica { id: string; titulo: string; artista: string; tom_atual: string; }
interface Usuario { id: string; nome: string; funcao: string; }
interface Culto {
  id: string; data: string; horario: string; tema: string; pregador: string; observacoes: string;
  repertorios: { musica: Musica; ordem: number; tom: string; observacao: string }[];
  escalas: { usuario: Usuario; funcao: string; confirmado: boolean }[];
}

export default function CultosPage() {
  const [cultos, setCultos] = useState<Culto[]>([])
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    data: '', horario: '', tema: '', pregador: '', observacoes: '',
  })
  const [repertorio, setRepertorio] = useState<{ musica_id: string; ordem: number; tom: string; observacao: string }[]>([])
  const [escala, setEscala] = useState<{ usuario_id: string; funcao: string }[]>([])

  useEffect(() => {
    loadCultos()
    fetch('/api/musicas').then(r => r.json()).then(d => setMusicas(Array.isArray(d) ? d : []))
    fetch('/api/usuarios').then(r => r.json()).then(d => setUsuarios(Array.isArray(d) ? d : []))
  }, [])

  async function loadCultos() {
    const res = await fetch('/api/cultos')
    const data = await res.json()
    setCultos(Array.isArray(data) ? data : [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/cultos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, repertorio, escala }),
    })
    if (res.ok) {
      toast.success('Culto criado!')
      setDialogOpen(false)
      setForm({ data: '', horario: '', tema: '', pregador: '', observacoes: '' })
      setRepertorio([])
      setEscala([])
      loadCultos()
    } else {
      toast.error('Erro ao criar culto')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza?')) return
    await fetch(`/api/cultos/${id}`, { method: 'DELETE' })
    toast.success('Culto excluído!')
    loadCultos()
  }

  function addMusica() {
    setRepertorio([...repertorio, { musica_id: '', ordem: repertorio.length + 1, tom: '', observacao: '' }])
  }

  function addMembro() {
    setEscala([...escala, { usuario_id: '', funcao: 'vocal' }])
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Cultos</h1>
            <p className="text-muted-foreground">{cultos.length} cultos planejados</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Button><Plus className="w-4 h-4 mr-2" /> Novo Culto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Culto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário *</Label>
                    <Input type="time" value={form.horario} onChange={e => setForm({...form, horario: e.target.value})} required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Tema</Label>
                    <Input value={form.tema} onChange={e => setForm({...form, tema: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pregador</Label>
                    <Input value={form.pregador} onChange={e => setForm({...form, pregador: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Repertório</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMusica}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  </div>
                  {repertorio.map((r, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                      <select className="flex-1 p-2 border rounded-md text-sm" value={r.musica_id} onChange={e => {
                        const next = [...repertorio]; next[i].musica_id = e.target.value; setRepertorio(next)
                      }}>
                        <option value="">Selecione...</option>
                        {musicas.map(m => <option key={m.id} value={m.id}>{m.titulo} - {m.artista}</option>)}
                      </select>
                      <Input className="w-16" placeholder="Tom" value={r.tom} onChange={e => {
                        const next = [...repertorio]; next[i].tom = e.target.value; setRepertorio(next)
                      }} />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Escala</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMembro}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  </div>
                  {escala.map((e, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select className="flex-1 p-2 border rounded-md text-sm" value={e.usuario_id} onChange={ev => {
                        const next = [...escala]; next[i].usuario_id = ev.target.value; setEscala(next)
                      }}>
                        <option value="">Selecione...</option>
                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.funcao})</option>)}
                      </select>
                      <select className="p-2 border rounded-md text-sm" value={e.funcao} onChange={ev => {
                        const next = [...escala]; next[i].funcao = ev.target.value; setEscala(next)
                      }}>
                        {['ministro','vocal','baixo','bateria','guitarra','violao','teclado'].map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Criar Culto</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {cultos.map(culto => (
            <Card key={culto.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      {culto.tema || 'Sem tema'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(culto.data).toLocaleDateString('pt-BR')} às {culto.horario}
                      {culto.pregador && ` • Pregador: ${culto.pregador}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(culto.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Music className="w-4 h-4" /> Repertório</h4>
                    {culto.repertorios?.length ? (
                      <ol className="space-y-1 text-sm">
                        {culto.repertorios.sort((a, b) => a.ordem - b.ordem).map((r, i) => (
                          <li key={i}>{i + 1}. {r.musica?.titulo || 'Música removida'} {r.tom && <Badge variant="outline" className="ml-1">{r.tom}</Badge>}</li>
                        ))}
                      </ol>
                    ) : <p className="text-sm text-muted-foreground">Sem repertório</p>}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Users className="w-4 h-4" /> Escala</h4>
                    {culto.escalas?.length ? (
                      <ul className="space-y-1 text-sm">
                        {culto.escalas.map((e, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Badge variant={e.confirmado ? 'default' : 'secondary'}>{e.funcao}</Badge>
                            {e.usuario?.nome || 'Usuário removido'}
                            {e.confirmado ? ' ✓' : ''}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted-foreground">Sem escala</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {cultos.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum culto planejado</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
