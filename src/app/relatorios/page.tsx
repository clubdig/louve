'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Music, Users } from 'lucide-react'

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
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Estatísticas do ministério</p>
        </div>

        <Tabs defaultValue="musicas">
          <TabsList>
            <TabsTrigger value="musicas"><Music className="w-4 h-4 mr-1" /> Músicas</TabsTrigger>
            <TabsTrigger value="musicos"><Users className="w-4 h-4 mr-1" /> Músicos</TabsTrigger>
          </TabsList>

          <TabsContent value="musicas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de Músicas</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{musicas.length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mais Tocada</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{musicas.sort((a, b) => b.vezes_tocada - a.vezes_tocada)[0]?.titulo || '-'}</div>
                  <p className="text-sm text-muted-foreground">{musicas.sort((a, b) => b.vezes_tocada - a.vezes_tocada)[0]?.vezes_tocada || 0} vezes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Nunca Tocada</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{musicas.filter(m => m.vezes_tocada === 0).length}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Histórico de Uso</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {musicas.sort((a, b) => b.vezes_tocada - a.vezes_tocada).map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="musicos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total de Músicos</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{musicos.length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Mais Escalado</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{musicos.sort((a, b) => b.total_escalas - a.total_escalas)[0]?.nome || '-'}</div>
                  <p className="text-sm text-muted-foreground">{musicos.sort((a, b) => b.total_escalas - a.total_escalas)[0]?.total_escalas || 0} vezes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Taxa de Confirmação</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {musicos.reduce((a, b) => a + b.total_escalas, 0) > 0
                      ? Math.round((musicos.reduce((a, b) => a + b.confirmadas, 0) / musicos.reduce((a, b) => a + b.total_escalas, 0)) * 100)
                      : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Participação dos Músicos</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {musicos.sort((a, b) => b.total_escalas - a.total_escalas).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <div>
                        <span className="font-medium">{u.nome}</span>
                        <span className="text-sm text-muted-foreground ml-2">{u.funcao}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {u.total_escalas} escala(s) • {u.confirmadas} confirmada(s)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
