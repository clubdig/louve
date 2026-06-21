import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Music, Calendar, Users, LayoutList } from 'lucide-react'

async function getStats() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'
  try {
    const [musicas, cultos, usuarios, escalas] = await Promise.all([
      fetch(`${baseUrl}/api/musicas`, { cache: 'no-store' }).then(r => r.json()).catch(() => []),
      fetch(`${baseUrl}/api/cultos`, { cache: 'no-store' }).then(r => r.json()).catch(() => []),
      fetch(`${baseUrl}/api/usuarios`, { cache: 'no-store' }).then(r => r.json()).catch(() => []),
      [],
    ])
    return {
      musicas: Array.isArray(musicas) ? musicas.length : 0,
      cultos: Array.isArray(cultos) ? cultos.length : 0,
      usuarios: Array.isArray(usuarios) ? usuarios.length : 0,
      proximoCulto: Array.isArray(cultos) && cultos.length > 0 ? cultos[0] : null,
    }
  } catch {
    return { musicas: 0, cultos: 0, usuarios: 0, proximoCulto: null }
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  const cards = [
    { title: 'Músicas', value: stats.musicas, icon: Music, color: 'text-purple-500' },
    { title: 'Cultos', value: stats.cultos, icon: Calendar, color: 'text-blue-500' },
    { title: 'Músicos', value: stats.usuarios, icon: Users, color: 'text-green-500' },
    { title: 'Escalas', value: 0, icon: LayoutList, color: 'text-orange-500' },
  ]

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Painel</h1>
          <p className="text-muted-foreground">Bem-vindo ao Louve</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {stats.proximoCulto && (
          <Card>
            <CardHeader>
              <CardTitle>Próximo Culto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-semibold">{stats.proximoCulto.tema || 'Sem tema'}</p>
                <p className="text-muted-foreground">
                  {new Date(stats.proximoCulto.data).toLocaleDateString('pt-BR')} às {stats.proximoCulto.horario}
                </p>
                {stats.proximoCulto.pregador && (
                  <p className="text-sm text-muted-foreground">Pregador: {stats.proximoCulto.pregador}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
