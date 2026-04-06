import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8091/api/zhandoubao'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${API}/mbti`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  return PUT(req)
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const res = await fetch(`${API}/mbti`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
