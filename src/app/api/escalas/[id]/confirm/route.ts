import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { confirmado } = await request.json()

  const token = request.cookies.get('auth-token')?.value
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { data: escala, error: fetchError } = await getDb()
    .from('escalas')
    .select('id, usuario_id')
    .eq('id', id)
    .single()

  if (fetchError || !escala) return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 })

  if (payload.funcao !== 'admin' && escala.usuario_id !== payload.userId) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { data, error } = await getDb()
    .from('escalas')
    .update({ confirmado })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
