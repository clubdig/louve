import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword, signToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { nome, email, password, funcao, telefone } = await request.json()

    if (!nome || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

    const senha_hash = await hashPassword(password)

    const { data: user, error } = await supabase
      .from('usuarios')
      .insert({
        nome,
        email,
        senha_hash,
        funcao: funcao || 'vocal',
        telefone,
        status: 'ativo',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      funcao: user.funcao,
      nome: user.nome,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        funcao: user.funcao,
      },
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
