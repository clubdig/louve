import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function getAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  const auth = getAuth(request)
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = getDb().from('cultos').select(`
    *,
    repertorios(*, musicas(*)),
    escalas(*, usuarios!usuario_id(id, nome, funcao, foto))
  `).order('data', { ascending: false })

  if (from) query = query.gte('data', from)
  if (to) query = query.lte('data', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = getAuth(request)
  if (!auth || auth.funcao !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await request.json()
  const { data, horario, tema, pregador, observacoes, repertorio, escala } = body

  if (!data || !horario) return NextResponse.json({ error: 'Data e horário obrigatórios' }, { status: 400 })

  const { data: culto, error } = await getDb()
    .from('cultos')
    .insert({ data, horario, tema, pregador, observacoes })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (repertorio?.length) {
    const repertorioInsert = repertorio.map((r: { musica_id: string; ordem: number; tom?: string; versao?: string; observacao?: string }) => ({
      culto_id: culto.id,
      ...r,
    }))
    await getDb().from('repertorios').insert(repertorioInsert)
  }

  if (escala?.length) {
    const escalaInsert = escala.map((e: { usuario_id: string; funcao: string; observacao?: string }) => ({
      culto_id: culto.id,
      ...e,
      confirmado: false,
    }))
    await getDb().from('escalas').insert(escalaInsert)
  }

  return NextResponse.json(culto)
}
