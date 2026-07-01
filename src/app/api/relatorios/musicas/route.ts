import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const { data: musicas, error: e1 } = await getDb()
    .from('musicas')
    .select('id, titulo, artista, categoria')
    .order('titulo')

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })

  const results = await Promise.all(
    (musicas || []).map(async (m) => {
      const { count } = await getDb()
        .from('musica_historico')
        .select('*', { count: 'exact', head: true })
        .eq('musica_id', m.id)

      const { data: ultimo } = await getDb()
        .from('musica_historico')
        .select('created_at, cultos(data)')
        .eq('musica_id', m.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return {
        ...m,
        vezes_tocada: count || 0,
        ultima_vez: (ultimo?.cultos as unknown as { data: string })?.data || null,
      }
    })
  )

  return NextResponse.json(results)
}
