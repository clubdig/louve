import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { hashPassword, verifyToken } from '@/lib/auth'

function checkAdmin(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload || payload.funcao !== 'admin') return null
  return payload
}

export async function GET(request: NextRequest) {
  const admin = checkAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data, error } = await getDb()
    .from('usuarios')
    .select('id, nome, email, funcao, telefone, foto, status, created_at')
    .order('nome')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const admin = checkAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const body = await request.json()
  const { nome, email, password, funcao, telefone } = body

  if (!nome || !email || !password) {
    return NextResponse.json({ error: 'Nome, email e senha obrigatórios' }, { status: 400 })
  }

  const senha_hash = await hashPassword(password)

  const { data, error } = await getDb()
    .from('usuarios')
    .insert({ nome, email, senha_hash, funcao: funcao || 'vocal', telefone, status: 'ativo' })
    .select('id, nome, email, funcao, telefone, foto, status')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
