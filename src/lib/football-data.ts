// Cliente mínimo da football-data.org (v4) para a Copa do Mundo (competição "WC").
// Docs: https://docs.football-data.org/general/v4/competition.html

const BASE = 'https://api.football-data.org/v4'
const SEASON = process.env.FOOTBALL_DATA_SEASON ?? '2026'

export type ApiTeam = {
  id: number
  name: string
  tla: string | null
  crest: string | null
}

export type ApiMatch = {
  id: number
  utcDate: string
  status: string // SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | SUSPENDED | POSTPONED | CANCELLED | AWARDED
  matchday: number | null
  stage: string
  group: string | null
  homeTeam: ApiTeam
  awayTeam: ApiTeam
  score: { fullTime: { home: number | null; away: number | null } }
}

export type StatusJogo = 'agendado' | 'ao_vivo' | 'encerrado'

/** Converte o status da API para o do nosso banco. null = ignorar (adiado/cancelado). */
export function mapStatus(apiStatus: string): StatusJogo | null {
  switch (apiStatus) {
    case 'IN_PLAY':
    case 'PAUSED':
      return 'ao_vivo'
    case 'FINISHED':
    case 'AWARDED':
      return 'encerrado'
    case 'SCHEDULED':
    case 'TIMED':
      return 'agendado'
    default: // SUSPENDED, POSTPONED, CANCELLED
      return null
  }
}

/** Busca todas as partidas da Copa do Mundo na temporada configurada. */
export async function fetchWorldCupMatches(): Promise<ApiMatch[]> {
  const token = process.env.FOOTBALL_DATA_API_KEY
  if (!token) throw new Error('FOOTBALL_DATA_API_KEY ausente nas variáveis de ambiente')

  const res = await fetch(`${BASE}/competitions/WC/matches?season=${SEASON}`, {
    headers: { 'X-Auth-Token': token },
    cache: 'no-store', // placar muda; nunca cachear
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`football-data ${res.status}: ${body.slice(0, 300)}`)
  }

  const data = (await res.json()) as { matches?: ApiMatch[] }
  return data.matches ?? []
}
