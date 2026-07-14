import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { hashPassword, verifyToken } from '@/lib/auth'

function getAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = getAuth(request)
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (auth.funcao !== 'admin' && auth.userId !== id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { data, error } = await getDb()
    .from('usuarios')
    .select('id, nome, email, funcao, telefone, foto, status, created_at')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = getAuth(request)
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()

  if (auth.funcao !== 'admin') {
    if (auth.userId !== id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    const allowed = ['nome', 'telefone', 'foto']
    const safeUpdate: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) safeUpdate[key] = body[key]
    }
    safeUpdate.updated_at = new Date().toISOString()
    const { data, error } = await getDb()
      .from('usuarios')
      .update(safeUpdate)
      .eq('id', id)
      .select('id, nome, email, funcao, telefone, foto, status')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const update: Record<string, unknown> = { ...body }
  if (update.password) {
    update.senha_hash = await hashPassword(update.password as string)
    delete update.password
  }
  update.updated_at = new Date().toISOString()

  const { data, error } = await getDb()
    .from('usuarios')
    .update(update)
    .eq('id', id)
    .select('id, nome, email, funcao, telefone, foto, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = getAuth(request)
  if (!auth || auth.funcao !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { error } = await getDb().from('usuarios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
