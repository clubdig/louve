import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const { id } = await params
  const body = await request.json()
  const { repertorio, escala, ...cultoData } = body

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
  const { id } = await params
  const { error } = await getDb().from('cultos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
