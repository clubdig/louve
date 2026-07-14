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
  const search = searchParams.get('search')
  const categoria = searchParams.get('categoria')

  let query = getDb().from('musicas').select('*').order('titulo')

  if (search) {
    query = query.or(`titulo.ilike.%${search}%,artista.ilike.%${search}%`)
  }
  if (categoria) {
    query = query.eq('categoria', categoria)
  }

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
  const { titulo, artista, tom_original, tom_atual, versao, bpm, youtube, cifra, spotify, playback, multitrack, categoria, observacoes } = body

  if (!titulo) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

  const { data, error } = await getDb()
    .from('musicas')
    .insert({
      titulo, artista, tom_original, tom_atual, versao, bpm,
      youtube, cifra, spotify, playback, multitrack,
      categoria: categoria || 'adoracao', observacoes,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
