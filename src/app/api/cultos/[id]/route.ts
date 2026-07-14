import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function getAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuth(request)
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const { data, error } = await getDb()
    .from('cultos')
    .select('*, repertorios(*, musicas(*)), escalas(*, usuarios!usuario_id(id, nome, funcao, foto))')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuth(request)
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { repertorio, escala, ...cultoData } = body

  if (auth.funcao !== 'admin') {
    const { data: culto } = await getDb().from('cultos').select('id').eq('id', id).single()
    if (!culto) return NextResponse.json({ error: 'Culto não encontrado' }, { status: 404 })

    const { data: escalas } = await getDb().from('escalas').select('usuario_id').eq('culto_id', id)
    const isInEscala = escalas?.some(e => e.usuario_id === auth.userId)
    if (!isInEscala) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { data: culto, error } = await getDb().from('cultos').update(cultoData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (repertorio) {
    await getDb().from('repertorios').delete().eq('culto_id', id)
    if (repertorio.length) {
      const insert = repertorio.map((r: { musica_id: string; ordem: number; tom?: string; versao?: string; observacao?: string }) => ({ culto_id: id, ...r }))
      await getDb().from('repertorios').insert(insert)
    }
  }

  if (escala) {
    await getDb().from('escalas').delete().eq('culto_id', id)
    if (escala.length) {
      const insert = escala.map((e: { usuario_id: string; funcao: string; observacao?: string }) => ({ culto_id: id, ...e, confirmado: false }))
      await getDb().from('escalas').insert(insert)
    }
  }

  return NextResponse.json(culto)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuth(request)
  if (!auth || auth.funcao !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params
  const { error } = await getDb().from('cultos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
