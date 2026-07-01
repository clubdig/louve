'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LayoutList, Check, X, Calendar, Music, Plus, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'

const funcaoLabel: Record<string, string> = {
  admin: 'Admin', ministro: 'Ministro', vocal: 'Vocal',
  baixo: 'Baixo', bateria: 'Bateria', guitarra: 'Guitarra',
  violao: 'Violão', teclado: 'Teclado',
}

interface Musica { id: string; titulo: string; artista: string; tom_atual: string; }
interface EscalaItem {
  id: string; culto_id: string; confirmado: boolean; funcao: string;
  cultos: { id: string; data: string; horario: string; tema: string; observacoes: string | null };
  usuarios: { id: string; nome: string; funcao: string };
}
interface RepertorioItem { id: string; musica_id: string; ordem: number; tom: string; observacao: string; musicas?: { id: string; titulo: string } }

export default function EscalasPage() {
  const [escalas, setEscalas] = useState<EscalaItem[]>([])
  const [userId, setUserId] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [repertorioMap, setRepertorioMap] = useState<Record<string, RepertorioItem[]>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogCultoId, setDialogCultoId] = useState('')
  const [repertorio, setRepertorio] = useState<{ musica_id: string; ordem: number; tom: string; categoria: string }[]>([])
  const [ensaioDialogOpen, setEnsaioDialogOpen] = useState(false)
  const [ensaioForm, setEnsaioForm] = useState({ data: '', horario: '', local: '' })
  const [pendingCultoId, setPendingCultoId] = useState('')
  const [questionarioOpen, setQuestionarioOpen] = useState(false)
  const [questionarioCultoId, setQuestionarioCultoId] = useState('')
  const [questionarioData, setQuestionarioData] = useState<{ musica_id: string; titulo: string; tom: string; solo: string }[]>([])
  const [searchOpen, setSearchOpen] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.id) setUserId(user.id)
    if (user.funcao === 'admin') setIsAdmin(true)
    else setIsAdmin(false)
    fetch('/api/musicas').then(r => r.json()).then(d => setMusicas(Array.isArray(d) ? d : []))
    loadEscalas()
  }, [])

  async function loadEscalas() {
    try {
      const res = await fetch('/api/cultos')
      const cultos = await res.json()
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const allEscalas: EscalaItem[] = []
      const repMap: Record<string, RepertorioItem[]> = {}

      for (const culto of (Array.isArray(cultos) ? cultos : [])) {
        if (culto.repertorios) {
          repMap[culto.id] = culto.repertorios
        }
        if (culto.escalas) {
          for (const esc of culto.escalas) {
            const usuario = esc.usuarios
            if (!usuario) continue
            if (!isAdmin && usuario.id !== user.id) continue
            allEscalas.push({
              id: esc.id,
              culto_id: culto.id,
              confirmado: esc.confirmado,
              funcao: esc.funcao,
              cultos: { id: culto.id, data: culto.data, horario: culto.horario, tema: culto.tema, observacoes: culto.observacoes },
              usuarios: { id: usuario.id, nome: usuario.nome, funcao: usuario.funcao },
            })
          }
        }
      }
      setEscalas(allEscalas)
      setRepertorioMap(repMap)

      const today = new Date().toISOString().split('T')[0]
      for (const culto of (Array.isArray(cultos) ? cultos : [])) {
        if (!culto.observacoes || !culto.repertorios?.length) continue
        let ensaioData = ''
        try { ensaioData = JSON.parse(culto.observacoes).ensaio_data || '' } catch {}
        if (ensaioData !== today) continue
        const userInEscala = culto.escalas?.some((e: any) => e.usuarios?.id === user.id)
        if (!userInEscala) continue
        const alreadyFilled = culto.repertorios.every((r: any) => {
          try { const o = JSON.parse(r.observacao || '{}'); return o.solo } catch { return false }
        })
        if (!alreadyFilled) {
          setQuestionarioCultoId(culto.id)
          setQuestionarioData(culto.repertorios.map((r: any) => ({
            musica_id: r.musica_id || r.musicas?.id || '',
            titulo: r.musicas?.titulo || '?',
            tom: r.tom || r.musicas?.tom_atual || '',
            solo: (() => { try { return JSON.parse(r.observacao || '{}').solo || '' } catch { return '' } })(),
          })))
          setQuestionarioOpen(true)
          break
        }
      }
    } catch {}
  }

  async function confirmar(escalaId: string, confirmado: boolean) {
    const res = await fetch(`/api/escalas/${escalaId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmado }),
    })
    if (res.ok) {
      toast.success(confirmado ? 'Presença confirmada!' : 'Presença recusada')
      loadEscalas()
    }
  }

  function openRepertorio(cultoId: string) {
    const existentes = (repertorioMap[cultoId] || []).map(r => {
      let cat = 'adoracao'
      try { cat = JSON.parse(r.observacao || '{}').categoria || 'adoracao' } catch {}
      return {
        musica_id: r.musica_id || r.musicas?.id || '',
        ordem: r.ordem,
        tom: r.tom || '',
        categoria: cat,
      }
    })
    setRepertorio(existentes.length ? existentes : [])
    setDialogCultoId(cultoId)
    setDialogOpen(true)
  }

  function addMusica() {
    setRepertorio([...repertorio, { musica_id: '', ordem: repertorio.length + 1, tom: '', categoria: 'adoracao' }])
  }

  function setCategoria(i: number, cat: string) {
    const next = [...repertorio]
    next[i].categoria = cat
    setRepertorio(next)
  }

  function removeMusica(i: number) {
    setRepertorio(repertorio.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, ordem: idx + 1 })))
  }

  async function saveRepertorio() {
    const culto = escalas.find(e => e.culto_id === dialogCultoId)?.cultos
    const temEnsaio = culto?.observacoes ? (() => { try { return JSON.parse(culto.observacoes).ensaio_data } catch { return null } })() : null

    if (repertorio.length > 0 && !temEnsaio) {
      setPendingCultoId(dialogCultoId)
      setDialogOpen(false)
      setEnsaioDialogOpen(true)
      return
    }

    await doSaveRepertorio(dialogCultoId)
  }

  async function doSaveRepertorio(cultoId: string) {
    const repWithObs = repertorio.map(r => ({
      ...r,
      observacao: JSON.stringify({ categoria: r.categoria }),
    }))
    const res = await fetch(`/api/cultos/${cultoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repertorio: repWithObs }),
    })
    if (res.ok) {
      toast.success('Repertório salvo!')
      setDialogOpen(false)
      loadEscalas()
    } else {
      toast.error('Erro ao salvar')
    }
  }

  async function saveEnsaio() {
    const culto = escalas.find(e => e.culto_id === pendingCultoId)?.cultos
    if (!culto) return

    let obs: any = {}
    try { obs = JSON.parse(culto.observacoes || '{}') } catch {}
    obs.ensaio_data = ensaioForm.data
    obs.ensaio_horario = ensaioForm.horario
    if (ensaioForm.local) obs.ensaio_local = ensaioForm.local

    await fetch(`/api/cultos/${pendingCultoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes: JSON.stringify(obs), repertorio }),
    })

    toast.success('Ensaio e repertório salvos!')
    setEnsaioDialogOpen(false)
    setEnsaioForm({ data: '', horario: '', local: '' })
    loadEscalas()
  }

  async function saveQuestionario() {
    for (const item of questionarioData) {
      const existing = (repertorioMap[questionarioCultoId] || []).find((r: any) => (r.musica_id || r.musicas?.id) === item.musica_id)
      if (existing) {
        const obs = JSON.stringify({ solo: item.solo })
        await fetch(`/api/cultos/${questionarioCultoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repertorio: (repertorioMap[questionarioCultoId] || []).map((r: any) => ({
              musica_id: r.musica_id || r.musicas?.id,
              ordem: r.ordem,
              tom: (r.musica_id || r.musicas?.id) === item.musica_id ? item.tom : r.tom,
              observacao: (r.musica_id || r.musicas?.id) === item.musica_id ? obs : r.observacao || '',
            })),
          }),
        })
      }
    }
    toast.success('Tons e solos salvos!')
    setQuestionarioOpen(false)
    loadEscalas()
  }

  const today = new Date().toISOString().split('T')[0]
  const proximas = escalas.filter(e => e.cultos.data >= today)
  const anteriores = escalas.filter(e => e.cultos.data < today)

  const cultoGroups = proximas.reduce((acc, esc) => {
    if (!acc[esc.culto_id]) acc[esc.culto_id] = { culto: esc.cultos, escalas: [] }
    acc[esc.culto_id].escalas.push(esc)
    return acc
  }, {} as Record<string, { culto: EscalaItem['cultos']; escalas: EscalaItem[] }>)

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">Escalas</h1>
          <p className="text-muted-foreground text-sm">Gerencie as escalas dos cultos</p>
        </div>

        {proximas.length > 0 && (
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-purple-400" /> Próximas Escalas</h2>

            {isAdmin ? (
              <div className="space-y-4">
                {Object.values(cultoGroups).map(({ culto, escalas: groupEscalas }) => {
                  const userInThisCulto = groupEscalas.some(e => e.usuarios.id === userId)
                  return (
                    <div key={culto.id} className="glass rounded-2xl overflow-hidden hover:glow-purple-sm transition-all relative">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                      <div className="p-4 md:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-base font-semibold">{culto.tema || 'Sem tema'}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(culto.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {culto.horario?.substring(0, 5)}
                            </p>
                          </div>
                          {userInThisCulto && (
                            <Button variant="outline" size="sm" onClick={() => openRepertorio(culto.id)} className="border-border/50">
                              <Music className="w-4 h-4 mr-1" /> Músicas
                            </Button>
                          )}
                        </div>
                      <div className="flex flex-wrap gap-2">
                        {groupEscalas.map(esc => (
                          <div key={esc.id} className="flex items-center gap-2">
                            <Badge variant={esc.confirmado ? 'default' : 'secondary'}>{funcaoLabel[esc.funcao] || esc.funcao}</Badge>
                            <span className="text-sm">{esc.usuarios.nome}</span>
                            {esc.confirmado && <span className="text-emerald-400 text-xs">✓</span>}
                          </div>
                        ))}
                      </div>
                      {repertorioMap[culto.id]?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Repertório:</p>
                          <ol className="text-sm space-y-0.5">
                            {repertorioMap[culto.id].sort((a: any, b: any) => a.ordem - b.ordem).map((r: any, i: number) => (
                              <li key={i}>{i + 1}. {r.musicas?.titulo || '?'} {r.tom && <Badge variant="outline" className="ml-1 text-xs">{r.tom}</Badge>}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="space-y-4">
                {proximas.map(escala => {
                  const repList = repertorioMap[escala.culto_id] || []
                  return (
                    <div key={escala.id} className="glass rounded-2xl overflow-hidden hover:glow-purple-sm transition-all relative">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                      <div className="p-4 md:p-5 space-y-3">
                        <div>
                          <h3 className="text-base font-semibold">{escala.cultos.tema || 'Sem tema'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(escala.cultos.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {escala.cultos.horario?.substring(0, 5)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge>{funcaoLabel[escala.funcao] || escala.funcao}</Badge>
                          {escala.confirmado && <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">Confirmado ✓</Badge>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant={escala.confirmado ? 'default' : 'outline'} onClick={() => confirmar(escala.id, true)} className={escala.confirmado ? 'gradient-purple text-white' : 'border-border/50'}>
                            <Check className="w-4 h-4 mr-1" /> Confirmar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => confirmar(escala.id, false)} className="border-border/50">
                            <X className="w-4 h-4 mr-1" /> Não poderei
                          </Button>
                        </div>
                        <div className="pt-2 border-t border-border/50">
                          <Button variant="outline" size="sm" className="w-full border-border/50" onClick={() => openRepertorio(escala.culto_id)}>
                            <Music className="w-4 h-4 mr-1" /> {repList.length ? 'Ver/Editar Músicas' : 'Adicionar Músicas'}
                          </Button>
                          {repList.length > 0 && (
                            <ol className="text-sm space-y-0.5 mt-2">
                              {repList.sort((a: any, b: any) => a.ordem - b.ordem).map((r: any, i: number) => (
                                <li key={i} className="text-muted-foreground">{i + 1}. {r.musicas?.titulo || '?'} {r.tom && <span className="text-xs">({r.tom})</span>}</li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {anteriores.length > 0 && (
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-4">Escalas Anteriores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {anteriores.map(escala => (
                <div key={escala.id} className="glass rounded-2xl p-4 opacity-60">
                  <h3 className="text-base font-semibold">{escala.cultos.tema || 'Sem tema'}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(escala.cultos.data + 'T12:00:00').toLocaleDateString('pt-BR')} às {escala.cultos.horario?.substring(0, 5)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">{escala.usuarios.nome}</span>
                    <Badge variant="secondary">{funcaoLabel[escala.funcao] || escala.funcao}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {proximas.length === 0 && anteriores.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center text-muted-foreground">
            <LayoutList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma escala encontrada</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto glass-strong border-glow p-6">
          <DialogHeader>
            <DialogTitle className="text-gradient">Repertório do Culto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {repertorio.length > 0 && (
              <div className="text-xs text-muted-foreground p-2 rounded-lg gradient-purple-subtle border-glow">
                A última música será marcada como <strong>Oferta</strong>.
              </div>
            )}
            {repertorio.map((r, i) => {
              const isLast = i === repertorio.length - 1
              const selectedMusica = musicas.find(m => m.id === r.musica_id)
              const filtered = musicas.filter(m =>
                m.titulo.toLowerCase().includes(searchText.toLowerCase()) ||
                (m.artista && m.artista.toLowerCase().includes(searchText.toLowerCase()))
              )
              return (
                <div key={i} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${isLast ? 'border-orange-500/30 gradient-purple-subtle' : 'glass'}`}>
                  <span className="text-lg font-bold text-purple-400 min-w-[40px] text-center shrink-0">{i + 1}º</span>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_100px_140px] gap-2 items-center">
                    <div className="relative">
                      <div className="flex items-center border border-border/50 rounded-xl bg-background/30">
                        <Search className="w-4 h-4 ml-2 text-muted-foreground shrink-0" />
                        <input
                          className="flex-1 p-2 text-sm outline-none bg-transparent min-w-0"
                          placeholder="Buscar música..."
                          value={searchOpen === i ? searchText : (selectedMusica ? `${selectedMusica.titulo}${selectedMusica.artista ? ' - ' + selectedMusica.artista : ''}` : '')}
                          onFocus={() => { setSearchOpen(i); setSearchText('') }}
                          onChange={e => setSearchText(e.target.value)}
                          onBlur={() => setTimeout(() => setSearchOpen(null), 200)}
                        />
                        {selectedMusica && (
                          <button className="mr-2 text-muted-foreground hover:text-foreground shrink-0" onClick={() => {
                            const next = [...repertorio]; next[i].musica_id = ''; setRepertorio(next)
                            setSearchOpen(null); setSearchText('')
                          }}>
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {searchOpen === i && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 glass-strong rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {filtered.length === 0 && (
                            <div className="p-2 text-sm text-muted-foreground">Nenhuma música encontrada</div>
                          )}
                          {filtered.map(m => (
                            <button
                              key={m.id}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors ${r.musica_id === m.id ? 'text-purple-400 gradient-purple-subtle' : ''}`}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                const next = [...repertorio]; next[i].musica_id = m.id; setRepertorio(next)
                                setSearchOpen(null); setSearchText('')
                              }}
                            >
                              {m.titulo} {m.artista && <span className="text-muted-foreground">- {m.artista}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input className="text-sm text-center bg-background/30" placeholder="Tom" value={r.tom} onChange={e => {
                      const next = [...repertorio]; next[i].tom = e.target.value; setRepertorio(next)
                    }} />
                    <select className="p-2 border border-border/50 rounded-xl text-sm bg-background/30 text-sm" value={r.categoria} onChange={e => setCategoria(i, e.target.value)}>
                      <option value="adoracao">Adoração</option>
                      <option value="celebracao">Celebração</option>
                      <option value="ceia">Ceia</option>
                      <option value="oferta">Oferta</option>
                      <option value="encerramento">Encerramento</option>
                      <option value="especial">Especial</option>
                    </select>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive px-2" onClick={() => removeMusica(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
            {repertorio.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma música adicionada</p>}
            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={addMusica} className="border-border/50"><Plus className="w-4 h-4 mr-1" /> Adicionar Música</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border/50">Cancelar</Button>
                <Button onClick={saveRepertorio} className="gradient-purple text-white hover:opacity-90">Salvar</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ensaioDialogOpen} onOpenChange={setEnsaioDialogOpen}>
        <DialogContent className="max-w-md glass-strong border-glow">
          <DialogHeader>
            <DialogTitle className="text-gradient">Agendar Ensaio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Você é o primeiro a cadastrar músicas para este culto. Informe o dia e horário do ensaio:</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Data do Ensaio *</Label>
              <Input type="date" value={ensaioForm.data} onChange={e => setEnsaioForm({...ensaioForm, data: e.target.value})} className="bg-background/50" required />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Horário *</Label>
              <Input type="time" value={ensaioForm.horario} onChange={e => setEnsaioForm({...ensaioForm, horario: e.target.value})} className="bg-background/50" required />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Local</Label>
              <Input value={ensaioForm.local} onChange={e => setEnsaioForm({...ensaioForm, local: e.target.value})} placeholder="Ex: Igreja, Sala" className="bg-background/50" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setEnsaioDialogOpen(false); setDialogOpen(true) }} className="border-border/50">Voltar</Button>
              <Button onClick={saveEnsaio} disabled={!ensaioForm.data || !ensaioForm.horario} className="gradient-purple text-white hover:opacity-90">Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={questionarioOpen} onOpenChange={setQuestionarioOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-strong border-glow">
          <DialogHeader>
            <DialogTitle className="text-gradient">Dia de Ensaio!</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Preencha os tons e quem vai solar em cada música:</p>
          <div className="space-y-4">
            {questionarioData.map((item, i) => (
              <div key={i} className="p-3 rounded-xl glass space-y-2">
                <p className="font-medium text-sm">{i + 1}. {item.titulo}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tom</Label>
                    <Input className="text-sm bg-background/30" value={item.tom} onChange={e => {
                      const next = [...questionarioData]; next[i].tom = e.target.value; setQuestionarioData(next)
                    }} placeholder="Ex: G, C#, E" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Solo Vocal</Label>
                    <Input className="text-sm bg-background/30" value={item.solo} onChange={e => {
                      const next = [...questionarioData]; next[i].solo = e.target.value; setQuestionarioData(next)
                    }} placeholder="Nome de quem sola" />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setQuestionarioOpen(false)} className="border-border/50">Depois</Button>
              <Button onClick={saveQuestionario} className="gradient-purple text-white hover:opacity-90">Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
