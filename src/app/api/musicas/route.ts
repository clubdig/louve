import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const categoria = searchParams.get('categoria')

  let query = db.from('musicas').select('*').order('titulo')

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
  const body = await request.json()
  const { titulo, artista, tom_original, tom_atual, versao, bpm, youtube, cifra, spotify, playback, multitrack, categoria, observacoes } = body

  if (!titulo) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

  const { data, error } = await db
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
