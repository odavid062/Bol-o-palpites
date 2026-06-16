export type Profile = {
  id: string
  nome: string
  is_admin: boolean
  created_at: string
}

export type Rodada = {
  id: number
  numero: number
  nome: string
  data: string | null
}

export type Jogo = {
  id: number
  rodada_id: number
  time_casa: string
  time_fora: string
  bandeira_casa: string | null
  bandeira_fora: string | null
  kickoff: string
  gols_casa: number | null
  gols_fora: number | null
  status: 'agendado' | 'encerrado'
}

export type Palpite = {
  id: number
  jogo_id: number
  participante_id: string
  palpite_casa: number
  palpite_fora: number
  pontos: number
  created_at: string
  updated_at: string
}

export type RankingRow = {
  id: string
  nome: string
  total_pontos: number
  posicao: number
}
