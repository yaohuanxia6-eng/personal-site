export const runtime = 'nodejs'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8091/api/zhandoubao'

/** PUT /api/sessions/[id]/micro-action-done — 标记微行动已完成 */
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const res = await fetch(`${API}/sessions/${id}/micro-action-done`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
