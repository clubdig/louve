'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Music, Calendar, Users, Clock, Music2, Search, Headphones, Play, ExternalLink, ChevronDown, ChevronUp, ListMusic } from 'lucide-react'

const funcaoLabel: Record<string, string> = {
  admin: 'Admin', ministro: 'Ministro', vocal: 'Vocal',
  baixo: 'Baixo', bateria: 'Bateria', guitarra: 'Guitarra',
  violao: 'Violão', teclado: 'Teclado',
}

interface Culto {
  id: string; data: string; horario: string; tema: string; pregador: string; observacoes: string;
  repertorios: { musicas: { titulo: string; artista: string; tom_atual: string; youtube?: string }; ordem: number; tom: string; observacao: string }[];
  escalas: { usuarios: { nome: string; funcao: string }; funcao: string; confirmado: boolean }[];
}

interface MusicaRelatorio {
  id: string; titulo: string; artista: string; categoria: string; versao: string; vezes_tocada: number; ultima_vez: string | null;
}

interface MusicoRelatorio {
  id: string; nome: string; funcao: string; total_escalas: number; confirmadas: number; ultima_escala: string | null;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
  return match ? match[1] : null
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

function formatDateBR(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState({ musicas: 0, cultos: 0, usuarios: 0, loading: true })
  const [proximoCulto, setProximoCulto] = useState<Culto | null>(null)
  const [ultimaPlaylist, setUltimaPlaylist] = useState<Culto | null>(null)
  const [musicasRelatorio, setMusicasRelatorio] = useState<MusicaRelatorio[]>([])
  const [musicosRelatorio, setMusicosRelatorio] = useState<MusicoRelatorio[]>([])
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [playlistOpen, setPlaylistOpen] = useState(false)
  const [currentSongIdx, setCurrentSongIdx] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [musicas, cultos, usuarios] = await Promise.all([
          fetch('/api/musicas').then(r => r.json()).catch(() => []),
          fetch('/api/cultos').then(r => r.json()).catch(() => []),
          fetch('/api/usuarios').then(r => r.json()).catch(() => []),
        ])
        const cultosArr = Array.isArray(cultos) ? cultos : []
        const today = new Date().toISOString().split('T')[0]
        const futuro = cultosArr
          .filter((c: Culto) => c.data >= today)
          .sort((a: Culto, b: Culto) => a.data.localeCompare(b.data))

        setStats({
          musicas: Array.isArray(musicas) ? musicas.length : 0,
          cultos: cultosArr.length,
          usuarios: Array.isArray(usuarios) ? usuarios.length : 0,
          loading: false,
        })
        setProximoCulto(futuro[0] || null)

        const comRepertorio = cultosArr
          .filter((c: Culto) => c.repertorios?.length > 0)
          .sort((a: Culto, b: Culto) => b.data.localeCompare(a.data))
        setUltimaPlaylist(comRepertorio[0] || null)
      } catch {
        setStats(s => ({ ...s, loading: false }))
      }
    }
    load()
  }, [])

  async function loadRelatorio(tipo: string) {
    if (tipo === 'musicas' && musicasRelatorio.length === 0) {
      const data = await fetch('/api/relatorios/musicas').then(r => r.json()).catch(() => [])
      setMusicasRelatorio(Array.isArray(data) ? data : [])
    } else if (tipo === 'musicos' && musicosRelatorio.length === 0) {
      const data = await fetch('/api/relatorios/musicos').then(r => r.json()).catch(() => [])
      setMusicosRelatorio(Array.isArray(data) ? data : [])
    }
  }

  function handleCardClick(tipo: string) {
    if (tipo === 'cultos') {
      router.push('/cultos')
    } else {
      setSearch('')
      loadRelatorio(tipo)
      setDialogOpen(tipo)
    }
  }

  const filteredMusicas = musicasRelatorio.filter(m =>
    m.titulo.toLowerCase().includes(search.toLowerCase()) ||
    (m.artista && m.artista.toLowerCase().includes(search.toLowerCase()))
  )

  const filteredMusicos = musicosRelatorio.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.funcao.toLowerCase().includes(search.toLowerCase())
  )

  const cards = [
    { key: 'musicas', title: 'Músicas', value: stats.musicas, icon: Music, color: 'text-purple-400', glow: 'from-purple-500/20' },
    { key: 'cultos', title: 'Cultos', value: stats.cultos, icon: Calendar, color: 'text-blue-400', glow: 'from-blue-500/20' },
    { key: 'musicos', title: 'Músicos', value: stats.usuarios, icon: Users, color: 'text-emerald-400', glow: 'from-emerald-500/20' },
  ]

  const vocais = proximoCulto?.escalas?.filter(e => e.funcao === 'vocal') || []
  const instrumentais = proximoCulto?.escalas?.filter(e => e.funcao !== 'vocal') || []

  return (
    <AppShell>
      <div className="space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">Painel</h1>
          <p className="text-muted-foreground text-sm md:text-base">Bem-vindo ao Louve</p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.key}
                className="glass rounded-2xl p-4 md:p-5 cursor-pointer hover:glow-purple-sm transition-all group relative overflow-hidden"
                onClick={() => handleCardClick(card.key)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">
                      {card.title}
                    </span>
                    <Icon className={`w-4 h-4 md:w-5 md:h-5 ${card.color}`} />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">
                    {stats.loading ? '...' : card.value}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {proximoCulto && (
          <div className="glass rounded-2xl glow-purple relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <h3 className="text-base md:text-lg font-semibold">Próximo Culto</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-lg md:text-xl font-bold text-gradient">{proximoCulto.tema || 'Sem tema'}</p>
                  <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(proximoCulto.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    <span className="mx-1">·</span>
                    <Clock className="w-4 h-4" />
                    {proximoCulto.horario?.substring(0, 5)}
                  </p>
                  {proximoCulto.pregador && (
                    <p className="text-sm text-muted-foreground mt-1">Pregador: {proximoCulto.pregador}</p>
                  )}
                  {(() => {
                    const ensaio = parseEnsaio(proximoCulto.observacoes)
                    if (!ensaio.data) return null
                    return (
                      <p className="text-sm text-purple-400 mt-1 flex items-center gap-1">
                        <Music2 className="w-4 h-4" />
                        Ensaio: {new Date(ensaio.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às {ensaio.horario}
                        {ensaio.local && ` • ${ensaio.local}`}
                      </p>
                    )
                  })()}
                </div>

                {proximoCulto.escalas?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Users className="w-4 h-4 text-purple-400" /> Escalados
                    </h4>
                    <div className="space-y-3">
                      {vocais.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Vocais</p>
                          <div className="flex flex-wrap gap-2">
                            {vocais.map((e, i) => (
                              <Badge key={i} variant={e.confirmado ? 'default' : 'secondary'} className="text-xs">
                                {e.usuarios?.nome || '?'}
                                {e.confirmado && ' ✓'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {instrumentais.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Instrumentos</p>
                          <div className="flex flex-wrap gap-2">
                            {instrumentais.map((e, i) => (
                              <Badge key={i} variant={e.confirmado ? 'default' : 'secondary'} className="text-xs">
                                {e.usuarios?.nome || '?'} <span className="text-muted-foreground ml-1">({funcaoLabel[e.funcao] || e.funcao})</span>
                                {e.confirmado && ' ✓'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {proximoCulto.repertorios?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Music className="w-4 h-4 text-purple-400" /> Repertório
                    </h4>
                    <ol className="space-y-1.5">
                      {proximoCulto.repertorios.sort((a, b) => a.ordem - b.ordem).map((r, i) => {
                        let solo = ''
                        let cat = 'adoracao'
                        try {
                          const obs = JSON.parse(r.observacao || '{}')
                          solo = obs.solo || ''
                          cat = obs.categoria || 'adoracao'
                        } catch {}
                        const catLabels: Record<string, string> = {
                          adoracao: '', celebracao: '', ceia: 'Ceia',
                          oferta: 'Oferta', encerramento: '', especial: '',
                        }
                        return (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground w-8 text-right font-medium">{i + 1}º</span>
                            <span className="font-medium">{r.musicas?.titulo || '?'}</span>
                            {r.tom && <Badge variant="outline" className="text-xs">{r.tom}</Badge>}
                            {solo && <span className="text-xs text-purple-400">Solo: {solo}</span>}
                            {catLabels[cat] && <Badge variant="secondary" className="text-xs">{catLabels[cat]}</Badge>}
                          </li>
                        )
                      })}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!stats.loading && !proximoCulto && (
          <div className="glass rounded-2xl p-8 text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Nenhum culto futuro planejado</p>
          </div>
        )}

        {/* Playlist da Semana */}
        {!stats.loading && (ultimaPlaylist?.repertorios?.length ?? 0) > 0 && (
          <div
            className="glass rounded-2xl p-5 cursor-pointer hover:glow-purple-sm transition-all group relative overflow-hidden"
            onClick={() => { setCurrentSongIdx(0); setPlaying(false); setPlaylistOpen(true) }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center shrink-0 glow-purple-sm">
                <Headphones className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gradient">Playlist da Semana</h3>
                <p className="text-sm text-muted-foreground">{ultimaPlaylist?.repertorios?.length} músicas para ouvir e praticar</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <Play className="w-3 h-3" /> Ouvir agora
                </div>
                <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen === 'musicas'} onOpenChange={(v) => { if (!v) { setDialogOpen(null); setSearch('') } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-strong border-glow">
          <DialogHeader>
            <DialogTitle className="text-gradient">Músicas Cadastradas ({filteredMusicas.length})</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 bg-background/50" placeholder="Buscar por título ou artista..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-2">
            {filteredMusicas.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl glass hover:glow-purple-sm transition-all">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.titulo}</p>
                  <p className="text-sm text-muted-foreground truncate">{m.artista || 'Sem artista'} {m.versao && `• ${m.versao}`}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Vezes</p>
                    <p className="font-semibold">{m.vezes_tocada}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Última vez</p>
                    <p className="text-sm">{formatDateBR(m.ultima_vez)}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredMusicas.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma música encontrada</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen === 'musicos'} onOpenChange={(v) => { if (!v) { setDialogOpen(null); setSearch('') } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto glass-strong border-glow">
          <DialogHeader>
            <DialogTitle className="text-gradient">Músicos Ativos ({filteredMusicos.length})</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 bg-background/50" placeholder="Buscar por nome ou instrumento..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="space-y-2">
            {filteredMusicos.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-xl glass hover:glow-purple-sm transition-all">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{u.nome}</p>
                  <p className="text-sm text-muted-foreground capitalize">{funcaoLabel[u.funcao] || u.funcao}</p>
                </div>
                <div className="flex items-center gap-4 ml-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Escalas</p>
                    <p className="font-semibold">{u.total_escalas}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Confirmadas</p>
                    <p className="font-semibold text-emerald-400">{u.confirmadas}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Última escala</p>
                    <p className="text-sm">{formatDateBR(u.ultima_escala)}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredMusicos.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum músico encontrado</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Playlist da Semana Dialog */}
      <Dialog open={playlistOpen} onOpenChange={setPlaylistOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-strong border-glow p-0">
          {ultimaPlaylist?.repertorios && (() => {
            const songs = ultimaPlaylist.repertorios.sort((a, b) => a.ordem - b.ordem)
            const currentSong = songs[currentSongIdx]
            const ytId = currentSong?.musicas?.youtube ? extractYouTubeId(currentSong.musicas.youtube) : null
            const searchQuery = currentSong?.musicas ? `${currentSong.musicas.titulo} ${currentSong.musicas.artista || ''} official` : ''

            return (
              <>
                {/* Header */}
                <div className="p-4 pb-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center glow-purple-sm">
                      <Headphones className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-gradient text-lg">Playlist da Semana</DialogTitle>
                      <p className="text-xs text-muted-foreground">{ultimaPlaylist.tema || 'Sem tema'} • {songs.length} músicas</p>
                    </div>
                  </div>
                </div>

                {/* Player Area */}
                <div className="px-4">
                  {ytId ? (
                    <div className="rounded-xl overflow-hidden aspect-video bg-black/50">
                      <iframe
                        key={ytId}
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl bg-black/30 aspect-video flex flex-col items-center justify-center gap-3">
                      <Music className="w-12 h-12 text-purple-400/50" />
                      <p className="text-sm text-muted-foreground">Vídeo não disponível</p>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Buscar no YouTube
                      </a>
                    </div>
                  )}
                </div>

                {/* Now Playing Info */}
                <div className="px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{currentSong?.musicas?.titulo || '?'}</p>
                      <p className="text-sm text-muted-foreground truncate">{currentSong?.musicas?.artista || 'Sem artista'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {currentSong?.tom && <Badge variant="outline">{currentSong.tom}</Badge>}
                      <span className="text-xs text-muted-foreground">{currentSongIdx + 1}/{songs.length}</span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="px-4 pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setCurrentSongIdx(i => Math.max(0, i - 1))}
                    disabled={currentSongIdx === 0}
                    className="p-2 rounded-xl glass hover:bg-accent transition-colors disabled:opacity-30"
                  >
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                  <button
                    onClick={() => {
                      if (ytId) {
                        const iframe = document.querySelector('iframe[src*="youtube"]') as HTMLIFrameElement
                        if (iframe) {
                          iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`
                        }
                      }
                    }}
                    className="w-12 h-12 rounded-full gradient-purple flex items-center justify-center glow-purple-sm hover:scale-105 transition-transform"
                  >
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </button>
                  <button
                    onClick={() => setCurrentSongIdx(i => Math.min(songs.length - 1, i + 1))}
                    disabled={currentSongIdx >= songs.length - 1}
                    className="p-2 rounded-xl glass hover:bg-accent transition-colors disabled:opacity-30"
                  >
                    <ChevronUp className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                {/* Song List */}
                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <ListMusic className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Músicas</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {songs.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSongIdx(i)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                          i === currentSongIdx
                            ? 'gradient-purple-subtle border-glow'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <span className={`w-5 text-center text-xs font-medium ${i === currentSongIdx ? 'text-purple-400' : 'text-muted-foreground'}`}>
                          {i === currentSongIdx && playing ? (
                            <span className="inline-block w-1.5 h-3 bg-purple-400 rounded-full animate-pulse" />
                          ) : (
                            i + 1
                          )}
                        </span>
                        <span className="flex-1 text-sm truncate">{r.musicas?.titulo || '?'}</span>
                        {r.tom && <Badge variant="outline" className="text-[10px] px-1 py-0">{r.tom}</Badge>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
