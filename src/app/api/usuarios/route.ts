import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function GET() {
  const { data, error } = await getDb()
    .from('usuarios')
    .select('id, nome, email, funcao, telefone, foto, status, created_at')
    .order('nome')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
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
