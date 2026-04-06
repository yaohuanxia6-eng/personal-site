import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://wttr.in/?format=j1', {
      headers: { 'User-Agent': 'niandoubao/1.0' },
      next: { revalidate: 1800 }, // cache 30 min
    })
    if (!res.ok) throw new Error('weather fetch failed')
    const data = await res.json()
    const current = data.current_condition?.[0]
    return NextResponse.json({
      temp: current?.temp_C ?? '',
      desc: current?.lang_zh?.[0]?.value ?? current?.weatherDesc?.[0]?.value ?? '',
      humidity: current?.humidity ?? '',
    })
  } catch {
    return NextResponse.json({ temp: '', desc: '', humidity: '' })
  }
}
