import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchWorldCupMatches, mapStatus } from '@/lib/football-data'
import { normalizar, traduzirTime } from '@/lib/wc-teams'

// Sempre dinâmico (nunca cacheia) e com folga de tempo de execução.
export const dynamic = 'force-dynamic'
export const maxDuration = 30

type JogoRow = {
  id: number
  api_match_id: number | null
  time_casa: string
  time_fora: string
  kickoff: string | null
  status: string
  gols_casa: number | null
  gols_fora: number | null
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes')
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

async function sincronizar() {
  const matches = await fetchWorldCupMatches()
  const sb = supabaseAdmin()

  const { data: jogos, error } = await sb
    .from('jogos')
    .select('id, api_match_id, time_casa, time_fora, kickoff, status, gols_casa, gols_fora')
  if (error) throw error
  const lista = (jogos ?? []) as JogoRow[]

  let atualizados = 0
  let vinculados = 0
  let semCorrespondencia = 0

  for (const m of matches) {
    const novoStatus = mapStatus(m.status)
    if (!novoStatus) continue

    // 1) localizar o jogo: por api_match_id; senão por nomes (traduzidos) + data
    let jogo = lista.find((j) => j.api_match_id === m.id)
    if (!jogo) {
      const casa = normalizar(traduzirTime(m.homeTeam?.name ?? ''))
      const fora = normalizar(traduzirTime(m.awayTeam?.name ?? ''))
      const dia = (m.utcDate ?? '').slice(0, 10)
      jogo = lista.find(
        (j) =>
          j.api_match_id == null &&
          normalizar(j.time_casa) === casa &&
          normalizar(j.time_fora) === fora &&
          (j.kickoff ?? '').slice(0, 10) === dia,
      )
      if (jogo) {
        await sb.from('jogos').update({ api_match_id: m.id }).eq('id', jogo.id)
        jogo.api_match_id = m.id
        vinculados++
      }
    }
    if (!jogo) {
      semCorrespondencia++
      continue
    }

    // 2) montar patch só com o que mudou (evita updates/triggers redundantes)
    const gc = m.score?.fullTime?.home ?? null
    const gf = m.score?.fullTime?.away ?? null
    const patch: Record<string, unknown> = {}
    if (jogo.status !== novoStatus) patch.status = novoStatus
    if (gc != null && gc !== jogo.gols_casa) patch.gols_casa = gc
    if (gf != null && gf !== jogo.gols_fora) patch.gols_fora = gf

    if (Object.keys(patch).length === 0) continue

    const { error: upErr } = await sb.from('jogos').update(patch).eq('id', jogo.id)
    if (!upErr) {
      Object.assign(jogo, patch)
      atualizados++
    }
  }

  return { ok: true, totalApi: matches.length, atualizados, vinculados, semCorrespondencia }
}

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // sem secret configurado, não bloqueia (dev)
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(await sincronizar())
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

// Permite acionar via POST também (alguns crons usam POST).
export const POST = GET
