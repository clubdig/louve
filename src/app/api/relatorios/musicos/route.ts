import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const { data: usuarios, error: e1 } = await getDb()
    .from('usuarios')
    .select('id, nome, funcao')
    .eq('status', 'ativo')
    .order('nome')

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })

  const results = await Promise.all(
    (usuarios || []).map(async (u) => {
      const { count } = await getDb()
        .from('escalas')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', u.id)

      const { data: ultimo } = await getDb()
        .from('escalas')
        .select('cultos(data)')
        .eq('usuario_id', u.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const { count: confirmadas } = await getDb()
        .from('escalas')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', u.id)
        .eq('confirmado', true)

      return {
        ...u,
        total_escalas: count || 0,
        confirmadas: confirmadas || 0,
        ultima_escala: (ultimo?.cultos as unknown as { data: string })?.data || null,
      }
    })
  )

  return NextResponse.json(results)
}
