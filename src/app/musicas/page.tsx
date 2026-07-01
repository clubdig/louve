'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Music, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Musica {
  id: string; titulo: string; artista: string; tom_original: string; tom_atual: string;
  versao: string; bpm: number; youtube: string; cifra: string; spotify: string;
  playback: string; multitrack: string; categoria: string; observacoes: string;
}

const categorias = [
  { value: 'adoracao', label: 'Adoração' },
  { value: 'celebracao', label: 'Celebração' },
  { value: 'ceia', label: 'Ceia' },
  { value: 'oferta', label: 'Oferta' },
  { value: 'encerramento', label: 'Encerramento' },
  { value: 'especial', label: 'Especial' },
]

const categoriaColors: Record<string, string> = {
  adoracao: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  celebracao: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  ceia: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  oferta: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  encerramento: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  especial: 'bg-red-500/15 text-red-400 border-red-500/20',
}

export default function MusicasPage() {
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Musica | null>(null)
  const [form, setForm] = useState({
    titulo: '', artista: '', tom_original: '', tom_atual: '', versao: '',
    bpm: '', youtube: '', cifra: '', spotify: '', playback: '', multitrack: '',
    categoria: 'adoracao', observacoes: '',
  })

  useEffect(() => { loadMusicas() }, [])

  async function loadMusicas() {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filtroCategoria && filtroCategoria !== 'all') params.set('categoria', filtroCategoria)
    const res = await fetch(`/api/musicas?${params}`)
    const data = await res.json()
    setMusicas(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    const timer = setTimeout(loadMusicas, 300)
    return () => clearTimeout(timer)
  }, [search, filtroCategoria])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = { ...form, bpm: form.bpm ? parseInt(form.bpm) : null }
    const url = editando ? `/api/musicas/${editando.id}` : '/api/musicas'
    const method = editando ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success(editando ? 'Música atualizada!' : 'Música criada!')
      setDialogOpen(false)
      setEditando(null)
      resetForm()
      loadMusicas()
    } else {
      toast.error('Erro ao salvar música')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta música?')) return
    const res = await fetch(`/api/musicas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Música excluída!')
      loadMusicas()
    }
  }

  function resetForm() {
    setForm({
      titulo: '', artista: '', tom_original: '', tom_atual: '', versao: '',
      bpm: '', youtube: '', cifra: '', spotify: '', playback: '', multitrack: '',
      categoria: 'adoracao', observacoes: '',
    })
  }

  function openEdit(m: Musica) {
    setEditando(m)
    setForm({
      titulo: m.titulo, artista: m.artista || '', tom_original: m.tom_original || '',
      tom_atual: m.tom_atual || '', versao: m.versao || '', bpm: m.bpm?.toString() || '',
      youtube: m.youtube || '', cifra: m.cifra || '', spotify: m.spotify || '',
      playback: m.playback || '', multitrack: m.multitrack || '',
      categoria: m.categoria || 'adoracao', observacoes: m.observacoes || '',
    })
    setDialogOpen(true)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient">Músicas</h1>
            <p className="text-muted-foreground">{musicas.length} músicas cadastradas</p>
          </div>
          <Button onClick={() => { setEditando(null); resetForm(); setDialogOpen(true) }} className="gradient-purple text-white glow-purple-sm hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Nova Música
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditando(null); resetForm() } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-strong border-glow">
            <DialogHeader>
              <DialogTitle className="text-gradient">{editando ? 'Editar Música' : 'Nova Música'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Título *</Label>
                  <Input value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className="bg-background/50" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Artista</Label>
                  <Input value={form.artista} onChange={e => setForm({...form, artista: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Tom Original</Label>
                  <Input value={form.tom_original} onChange={e => setForm({...form, tom_original: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Tom Atual</Label>
                  <Input value={form.tom_atual} onChange={e => setForm({...form, tom_atual: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Versão</Label>
                  <Input value={form.versao} onChange={e => setForm({...form, versao: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">BPM</Label>
                  <Input type="number" value={form.bpm} onChange={e => setForm({...form, bpm: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-muted-foreground">Categoria</Label>
                  <Select value={form.categoria} onValueChange={v => { if (v) setForm({...form, categoria: v}) }}>
                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-muted-foreground">YouTube</Label>
                  <Input value={form.youtube} onChange={e => setForm({...form, youtube: e.target.value})} placeholder="https://youtube.com/..." className="bg-background/50" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-muted-foreground">Cifra Club</Label>
                  <Input value={form.cifra} onChange={e => setForm({...form, cifra: e.target.value})} placeholder="https://www.cifraclub.com.br/..." className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Spotify</Label>
                  <Input value={form.spotify} onChange={e => setForm({...form, spotify: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Playback</Label>
                  <Input value={form.playback} onChange={e => setForm({...form, playback: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-muted-foreground">Observações</Label>
                  <Textarea value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} className="bg-background/50" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditando(null); resetForm() }} className="border-border/50">Cancelar</Button>
                <Button type="submit" className="gradient-purple text-white hover:opacity-90">{editando ? 'Salvar' : 'Criar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 bg-background/50" placeholder="Buscar música ou artista..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filtroCategoria} onValueChange={v => { if (v) setFiltroCategoria(v); }}>
            <SelectTrigger className="w-full sm:w-48 bg-background/50"><SelectValue placeholder="Todas categorias" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {musicas.map(m => (
            <div key={m.id} className="glass rounded-2xl p-4 hover:glow-purple-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate">{m.titulo}</h3>
                  <p className="text-sm text-muted-foreground truncate">{m.artista}</p>
                </div>
                <Badge variant="outline" className={categoriaColors[m.categoria] || ''}>
                  {categorias.find(c => c.value === m.categoria)?.label || m.categoria}
                </Badge>
              </div>
              <div className="flex gap-2 flex-wrap mb-3">
                {m.tom_original && <Badge variant="outline" className="text-xs">Tom: {m.tom_atual || m.tom_original}</Badge>}
                {m.bpm && <Badge variant="outline" className="text-xs">{m.bpm} BPM</Badge>}
                {m.versao && <Badge variant="outline" className="text-xs">{m.versao}</Badge>}
              </div>
              <div className="flex gap-1 pt-3 border-t border-border/50">
                {m.youtube && <a href={m.youtube} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300"><ExternalLink className="w-4 h-4" /></Button></a>}
                {m.cifra && <a href={m.cifra} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300"><Music className="w-4 h-4" /></Button></a>}
                <Button variant="ghost" size="sm" onClick={() => openEdit(m)} className="text-muted-foreground hover:text-foreground">Editar</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive ml-auto" onClick={() => handleDelete(m.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>

        {musicas.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma música encontrada</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
