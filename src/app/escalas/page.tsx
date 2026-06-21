'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LayoutList, Check, X, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface EscalaItem {
  id: string
  culto_id: string
  confirmado: boolean
  funcao: string
  observacao: string
  cultos: { data: string; horario: string; tema: string }
  usuarios: { nome: string; funcao: string }
}

export default function EscalasPage() {
  const [escalas, setEscalas] = useState<EscalaItem[]>([])
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.userId) setUserId(user.userId)
    loadEscalas()
  }, [])

  async function loadEscalas() {
    try {
      const res = await fetch('/api/cultos')
      const cultos = await res.json()
      const allEscalas: EscalaItem[] = []
      for (const culto of (Array.isArray(cultos) ? cultos : [])) {
        if (culto.escalas) {
          for (const esc of culto.escalas) {
            allEscalas.push({
              id: esc.id,
              culto_id: culto.id,
              confirmado: esc.confirmado,
              funcao: esc.funcao,
              observacao: esc.observacao,
              cultos: { data: culto.data, horario: culto.horario, tema: culto.tema },
              usuarios: esc.usuario || { nome: 'Desconhecido', funcao: esc.funcao },
            })
          }
        }
      }
      setEscalas(allEscalas)
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

  const minhasEscalas = escalas.filter(e => e.usuarios?.nome)
  const proximas = minhasEscalas.filter(e => new Date(e.cultos.data) >= new Date())
  const anteriores = minhasEscalas.filter(e => new Date(e.cultos.data) < new Date())

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Escalas</h1>
          <p className="text-muted-foreground">Gerencie as escalas dos cultos</p>
        </div>

        {proximas.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Próximas Escalas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proximas.map(escala => (
                <Card key={escala.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{escala.cultos.tema || 'Sem tema'}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(escala.cultos.data).toLocaleDateString('pt-BR')} às {escala.cultos.horario}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{escala.usuarios.nome}</span>
                      <Badge>{escala.funcao}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={escala.confirmado ? 'default' : 'outline'}
                        onClick={() => confirmar(escala.id, true)}
                      >
                        <Check className="w-4 h-4 mr-1" /> Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmar(escala.id, false)}
                      >
                        <X className="w-4 h-4 mr-1" /> Não poderei
                      </Button>
                    </div>
                    {escala.confirmado && <Badge className="bg-green-100 text-green-800">Confirmado ✓</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {anteriores.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Escalas Anteriores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {anteriores.map(escala => (
                <Card key={escala.id} className="opacity-70">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{escala.cultos.tema || 'Sem tema'}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(escala.cultos.data).toLocaleDateString('pt-BR')} às {escala.cultos.horario}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{escala.usuarios.nome}</span>
                      <Badge variant="secondary">{escala.funcao}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {minhasEscalas.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <LayoutList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma escala encontrada</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
