export const runtime = 'nodejs'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8091/api/zhandoubao'

/** GET /api/sessions/yesterday — 获取昨日会话 */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${API}/sessions/yesterday`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
