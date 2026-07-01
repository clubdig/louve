'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Calendar, Music, Users, Trash2, Pencil, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const funcaoLabel: Record<string, string> = {
  admin: 'Admin', ministro: 'Ministro', vocal: 'Vocal',
  baixo: 'Baixo', bateria: 'Bateria', guitarra: 'Guitarra',
  violao: 'Violão', teclado: 'Teclado',
}

const mesLabels = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

interface Musica { id: string; titulo: string; artista: string; tom_atual: string; }
interface Usuario { id: string; nome: string; funcao: string; }
interface Culto {
  id: string; data: string; horario: string; tema: string; pregador: string; observacoes: string;
  repertorios: { musicas: Musica; ordem: number; tom: string; observacao: string }[];
  escalas: { usuarios: Usuario; funcao: string; confirmado: boolean }[];
}

function isFirstSunday(dateStr: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T12:00:00')
  return d.getDate() <= 7 && d.getDay() === 0
}

function getDefaultTema(data: string): string {
  return isFirstSunday(data) ? 'Santa Ceia' : 'Culto de Celebração'
}

function getDefaultHorario(data: string): string {
  return isFirstSunday(data) ? '08:30' : '17:30'
}

function parseEnsaio(observacoes: string | null): { data: string; horario: string; local: string } {
  if (!observacoes) return { data: '', horario: '', local: '' }
  try {
    const obj = JSON.parse(observacoes)
    return { data: obj.ensaio_data || '', horario: obj.ensaio_horario || '', local: obj.ensaio_local || '' }
  } catch {
    return { data: '', horario: '', local: '' }
  }
}

function buildEnsaioObs(ensaio: { data: string; horario: string; local: string }, extra: string): string {
  const obj: any = {}
  if (ensaio.data) obj.ensaio_data = ensaio.data
  if (ensaio.horario) obj.ensaio_horario = ensaio.horario
  if (ensaio.local) obj.ensaio_local = ensaio.local
  if (extra) obj.observacoes_gerais = extra
  return JSON.stringify(obj)
}

const emptyForm = { data: '', horario: '', tema: '', pregador: '', observacoes: '' }

export default function CultosPage() {
  const [cultos, setCultos] = useState<Culto[]>([])
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [ensaio, setEnsaio] = useState({ data: '', horario: '', local: '' })
  const [repertorio, setRepertorio] = useState<{ musica_id: string; ordem: number; tom: string; observacao: string }[]>([])
  const [escala, setEscala] = useState<{ usuario_id: string; funcao: string }[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const now = new Date()
  const [filterMonth, setFilterMonth] = useState(now.getMonth())
  const [filterYear, setFilterYear] = useState(now.getFullYear())

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

  const filteredCultos = cultos.filter(c => {
    const d = new Date(c.data + 'T12:00:00')
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear
  }).sort((a, b) => a.data.localeCompare(b.data))

  function prevMonth() {
    if (filterMonth === 0) { setFilterMonth(11); setFilterYear(y => y - 1) }
    else setFilterMonth(m => m - 1)
  }

  function nextMonth() {
    if (filterMonth === 11) { setFilterMonth(0); setFilterYear(y => y + 1) }
    else setFilterMonth(m => m + 1)
  }

  function openNew() {
    setEditingId(null)
    const today = new Date().toISOString().split('T')[0]
    const tema = getDefaultTema(today)
    const horario = getDefaultHorario(today)
    setForm({ data: today, horario, tema, pregador: '', observacoes: '' })
    setEnsaio({ data: '', horario: '', local: '' })
    setRepertorio([])
    setEscala([])
    setDialogOpen(true)
  }

  function openEdit(culto: Culto) {
    setEditingId(culto.id)
    const ensaioInfo = parseEnsaio(culto.observacoes)
    setForm({
      data: culto.data.split('T')[0],
      horario: culto.horario?.substring(0, 5) || '',
      tema: culto.tema || '',
      pregador: culto.pregador || '',
      observacoes: '',
    })
    setEnsaio(ensaioInfo)
    setRepertorio(
      (culto.repertorios || []).sort((a, b) => a.ordem - b.ordem).map(r => ({
        musica_id: r.musicas?.id || '',
        ordem: r.ordem,
        tom: r.tom || '',
        observacao: r.observacao || '',
      }))
    )
    setEscala(
      (culto.escalas || []).map(e => ({
        usuario_id: e.usuarios?.id || '',
        funcao: e.funcao || 'vocal',
      }))
    )
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const observacoes = buildEnsaioObs(ensaio, form.observacoes)
    const url = editingId ? `/api/cultos/${editingId}` : '/api/cultos'
    const method = editingId ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, observacoes, repertorio, escala }),
    })
    if (res.ok) {
      toast.success(editingId ? 'Culto atualizado!' : 'Culto criado!')
      setDialogOpen(false)
      loadCultos()
    } else {
      toast.error('Erro ao salvar culto')
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

  function removeMusica(i: number) {
    setRepertorio(repertorio.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, ordem: idx + 1 })))
  }

  function addMembro() {
    setEscala([...escala, { usuario_id: '', funcao: 'vocal' }])
  }

  function removeMembro(i: number) {
    setEscala(escala.filter((_, idx) => idx !== i))
  }

  function handleDataChange(val: string) {
    setForm({
      ...form,
      data: val,
      tema: getDefaultTema(val),
      horario: getDefaultHorario(val),
    })
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient">Cultos</h1>
            <p className="text-muted-foreground text-sm">{filteredCultos.length} culto(s) em {mesLabels[filterMonth]}</p>
          </div>
          <Button onClick={openNew} className="gradient-purple text-white glow-purple-sm hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Novo Culto
          </Button>
        </div>

        {/* Month Navigator */}
        <div className="glass rounded-2xl p-3 flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-accent transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-gradient">{mesLabels[filterMonth]} {filterYear}</p>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-accent transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Month Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {mesLabels.map((m, i) => {
            const isActive = i === filterMonth
            return (
              <button
                key={i}
                onClick={() => setFilterMonth(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'gradient-purple text-white glow-purple-sm'
                    : 'glass text-muted-foreground hover:text-foreground'
                }`}
              >
                {m.substring(0, 3)}
              </button>
            )
          })}
        </div>

        {/* Cultos List */}
        <div className="space-y-3">
          {filteredCultos.map(culto => {
            const ensaioInfo = parseEnsaio(culto.observacoes)
            const d = new Date(culto.data + 'T12:00:00')
            const dayNum = d.getDate()
            const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
            const isExpanded = expandedId === culto.id
            const isCeia = isFirstSunday(culto.data)

            return (
              <div key={culto.id} className="glass rounded-2xl overflow-hidden transition-all">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

                {/* Compact Card */}
                <div className="p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    {/* Date Badge */}
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${isCeia ? 'bg-blue-500/15 border border-blue-500/20' : 'gradient-purple-subtle border-glow'}`}>
                      <span className="text-[10px] uppercase text-muted-foreground">{weekday}</span>
                      <span className="text-xl font-bold">{dayNum}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{culto.tema || 'Sem tema'}</h3>
                        {isCeia && <Badge className="text-[10px] bg-blue-500/15 text-blue-400 border-blue-500/20">Ceia</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{culto.horario?.substring(0, 5)}</span>
                        {culto.pregador && <span>Pregador: {culto.pregador}</span>}
                      </div>
                      {ensaioInfo.data && (
                        <p className="text-[11px] text-purple-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Ensaio: {new Date(ensaioInfo.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} às {ensaioInfo.horario}
                          {ensaioInfo.local && ` • ${ensaioInfo.local}`}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(culto)} className="text-muted-foreground hover:text-foreground h-8 w-8 p-0">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0" onClick={() => handleDelete(culto.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : culto.id)}
                        className="p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 md:px-4 md:pb-4 pt-0 border-t border-border/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      {/* Repertório */}
                      <div>
                        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1 text-purple-400 uppercase tracking-wide">
                          <Music className="w-3.5 h-3.5" /> Repertório ({culto.repertorios?.length || 0})
                        </h4>
                        {culto.repertorios?.length ? (
                          <ol className="space-y-1">
                            {culto.repertorios.sort((a, b) => a.ordem - b.ordem).map((r, i) => {
                              let solo = ''
                              try { solo = JSON.parse(r.observacao || '{}').solo || '' } catch {}
                              return (
                                <li key={i} className="flex items-center gap-2 text-sm py-1">
                                  <span className="text-muted-foreground w-5 text-right text-xs font-medium">{i + 1}º</span>
                                  <span className="flex-1">{r.musicas?.titulo || 'Música removida'}</span>
                                  {r.tom && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.tom}</Badge>}
                                  {solo && <span className="text-[10px] text-purple-400">Solo: {solo}</span>}
                                </li>
                              )
                            })}
                          </ol>
                        ) : <p className="text-sm text-muted-foreground">Sem repertório</p>}
                      </div>

                      {/* Escala */}
                      <div>
                        <h4 className="text-xs font-semibold mb-2 flex items-center gap-1 text-purple-400 uppercase tracking-wide">
                          <Users className="w-3.5 h-3.5" /> Escala ({culto.escalas?.length || 0})
                        </h4>
                        {culto.escalas?.length ? (
                          <div className="space-y-1">
                            {culto.escalas.map((e, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm py-1">
                                <Badge variant={e.confirmado ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                  {funcaoLabel[e.funcao] || e.funcao}
                                </Badge>
                                <span className="flex-1">{e.usuarios?.nome || 'Usuário removido'}</span>
                                {e.confirmado && <span className="text-emerald-400 text-xs">✓</span>}
                                {!e.confirmado && <span className="text-red-400 text-xs">✗</span>}
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-muted-foreground">Sem escala</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredCultos.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum culto em {mesLabels[filterMonth]}</p>
          </div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="w-[95vw] h-[90vh] max-w-none overflow-y-auto glass-strong border-glow p-6">
            <DialogHeader>
              <DialogTitle className="text-gradient">{editingId ? 'Editar Culto' : 'Novo Culto'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Data do Culto *</Label>
                  <Input type="date" value={form.data} onChange={e => handleDataChange(e.target.value)} className="bg-background/50" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Horário *</Label>
                  <Input type="time" value={form.horario} onChange={e => setForm({...form, horario: e.target.value})} className="bg-background/50" required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-muted-foreground">Tema</Label>
                  <Input value={form.tema} onChange={e => setForm({...form, tema: e.target.value})} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Pregador</Label>
                  <Input value={form.pregador} onChange={e => setForm({...form, pregador: e.target.value})} className="bg-background/50" />
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <Label className="text-base font-semibold">Ensaio</Label>
                <p className="text-xs text-muted-foreground mb-3">Dia e horário do ensaio desta escala</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Data</Label>
                    <Input type="date" value={ensaio.data} onChange={e => setEnsaio({...ensaio, data: e.target.value})} className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Horário</Label>
                    <Input type="time" value={ensaio.horario} onChange={e => setEnsaio({...ensaio, horario: e.target.value})} className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Local</Label>
                    <Input value={ensaio.local} onChange={e => setEnsaio({...ensaio, local: e.target.value})} placeholder="Ex: Igreja, Sala" className="bg-background/50" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Repertório</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMusica} className="border-border/50"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                </div>
                {repertorio.map((r, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                    <select className="flex-1 p-2 rounded-lg text-sm bg-background/50 border border-border/50" value={r.musica_id} onChange={e => {
                      const next = [...repertorio]; next[i].musica_id = e.target.value; setRepertorio(next)
                    }}>
                      <option value="">Selecione...</option>
                      {musicas.map(m => <option key={m.id} value={m.id}>{m.titulo} - {m.artista}</option>)}
                    </select>
                    <Input className="w-16 bg-background/50" placeholder="Tom" value={r.tom} onChange={e => {
                      const next = [...repertorio]; next[i].tom = e.target.value; setRepertorio(next)
                    }} />
                    <Button type="button" variant="ghost" size="sm" className="text-destructive px-2" onClick={() => removeMusica(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Escala</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMembro} className="border-border/50"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                </div>
                {escala.map((e, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select className="flex-1 p-2 rounded-lg text-sm bg-background/50 border border-border/50" value={e.usuario_id} onChange={ev => {
                      const next = [...escala]; next[i].usuario_id = ev.target.value; setEscala(next)
                    }}>
                      <option value="">Selecione...</option>
                      {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({funcaoLabel[u.funcao] || u.funcao})</option>)}
                    </select>
                    <select className="p-2 rounded-lg text-sm bg-background/50 border border-border/50" value={e.funcao} onChange={ev => {
                      const next = [...escala]; next[i].funcao = ev.target.value; setEscala(next)
                    }}>
                      {['ministro','vocal','baixo','bateria','guitarra','violao','teclado'].map(f => (
                        <option key={f} value={f}>{funcaoLabel[f] || f}</option>
                      ))}
                    </select>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive px-2" onClick={() => removeMembro(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-border/50">Cancelar</Button>
                <Button type="submit" className="gradient-purple text-white hover:opacity-90">{editingId ? 'Salvar' : 'Criar Culto'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
