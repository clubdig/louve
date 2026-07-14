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
  const { data, error } = await getDb().from('musicas').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuth(request)
  if (!auth || auth.funcao !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  body.updated_at = new Date().toISOString()

  const { data, error } = await getDb().from('musicas').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuth(request)
  if (!auth || auth.funcao !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { id } = await params
  const { error } = await getDb().from('musicas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
