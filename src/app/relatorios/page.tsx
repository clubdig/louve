'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Music, Users } from 'lucide-react'

const funcaoLabel: Record<string, string> = {
  admin: 'Admin', ministro: 'Ministro', vocal: 'Vocal',
  baixo: 'Baixo', bateria: 'Bateria', guitarra: 'Guitarra',
  violao: 'Violão', teclado: 'Teclado',
}

interface MusicaRel { id: string; titulo: string; artista: string; categoria: string; vezes_tocada: number; ultima_vez: string; }
interface MusicoRel { id: string; nome: string; funcao: string; total_escalas: number; confirmadas: number; ultima_escala: string; }

export default function RelatoriosPage() {
  const [musicas, setMusicas] = useState<MusicaRel[]>([])
  const [musicos, setMusicos] = useState<MusicoRel[]>([])

  useEffect(() => {
    fetch('/api/relatorios/musicas').then(r => r.json()).then(d => setMusicas(Array.isArray(d) ? d : []))
    fetch('/api/relatorios/musicos').then(r => r.json()).then(d => setMusicos(Array.isArray(d) ? d : []))
  }, [])

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient">Relatórios</h1>
          <p className="text-muted-foreground">Estatísticas do ministério</p>
        </div>

        <Tabs defaultValue="musicas">
          <TabsList className="glass">
            <TabsTrigger value="musicas" className="data-[state=active]:gradient-purple data-[state=active]:text-white"><Music className="w-4 h-4 mr-1" /> Músicas</TabsTrigger>
            <TabsTrigger value="musicos" className="data-[state=active]:gradient-purple data-[state=active]:text-white"><Users className="w-4 h-4 mr-1" /> Músicos</TabsTrigger>
          </TabsList>

          <TabsContent value="musicas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="glass rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Total de Músicas</p>
                <p className="text-3xl font-bold text-gradient">{musicas.length}</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Mais Tocada</p>
                <p className="text-lg font-bold">{musicas.sort((a, b) => b.vezes_tocada - a.vezes_tocada)[0]?.titulo || '-'}</p>
                <p className="text-sm text-purple-400">{musicas.sort((a, b) => b.vezes_tocada - a.vezes_tocada)[0]?.vezes_tocada || 0} vezes</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Nunca Tocada</p>
                <p className="text-3xl font-bold text-gradient">{musicas.filter(m => m.vezes_tocada === 0).length}</p>
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Histórico de Uso</h3>
              <div className="space-y-2">
                {musicas.sort((a, b) => b.vezes_tocada - a.vezes_tocada).map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-accent/50 transition-colors">
                    <div>
                      <span className="font-medium">{m.titulo}</span>
                      <span className="text-sm text-muted-foreground ml-2">{m.artista}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {m.vezes_tocada} vez(es)
                      {m.ultima_vez && ` • Última: ${new Date(m.ultima_vez).toLocaleDateString('pt-BR')}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="musicos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="glass rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Total de Músicos</p>
                <p className="text-3xl font-bold text-gradient">{musicos.length}</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Mais Escalado</p>
                <p className="text-lg font-bold">{musicos.sort((a, b) => b.total_escalas - a.total_escalas)[0]?.nome || '-'}</p>
                <p className="text-sm text-purple-400">{musicos.sort((a, b) => b.total_escalas - a.total_escalas)[0]?.total_escalas || 0} vezes</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Taxa de Confirmação</p>
                <p className="text-3xl font-bold text-gradient">
                  {musicos.reduce((a, b) => a + b.total_escalas, 0) > 0
                    ? Math.round((musicos.reduce((a, b) => a + b.confirmadas, 0) / musicos.reduce((a, b) => a + b.total_escalas, 0)) * 100)
                    : 0}%
                </p>
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Participação dos Músicos</h3>
              <div className="space-y-2">
                {musicos.sort((a, b) => b.total_escalas - a.total_escalas).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-accent/50 transition-colors">
                    <div>
                      <span className="font-medium">{u.nome}</span>
                        <span className="text-sm text-muted-foreground ml-2">{funcaoLabel[u.funcao] || u.funcao}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {u.total_escalas} escala(s) • {u.confirmadas} confirmada(s)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
