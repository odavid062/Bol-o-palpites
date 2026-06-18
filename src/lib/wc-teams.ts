// Mapa de seleções: nome em inglês (football-data.org) -> nome em PT + bandeira.
// Usado para (a) vincular jogos cadastrados em PT às partidas da API e
// (b) traduzir nomes na hora de importar.

type Time = { pt: string; flag: string }

const MAPA: Record<string, Time> = {
  // Anfitriões
  'United States': { pt: 'Estados Unidos', flag: '🇺🇸' },
  'Mexico': { pt: 'México', flag: '🇲🇽' },
  'Canada': { pt: 'Canadá', flag: '🇨🇦' },
  // América do Sul
  'Brazil': { pt: 'Brasil', flag: '🇧🇷' },
  'Argentina': { pt: 'Argentina', flag: '🇦🇷' },
  'Uruguay': { pt: 'Uruguai', flag: '🇺🇾' },
  'Colombia': { pt: 'Colômbia', flag: '🇨🇴' },
  'Ecuador': { pt: 'Equador', flag: '🇪🇨' },
  'Paraguay': { pt: 'Paraguai', flag: '🇵🇾' },
  'Peru': { pt: 'Peru', flag: '🇵🇪' },
  'Chile': { pt: 'Chile', flag: '🇨🇱' },
  'Bolivia': { pt: 'Bolívia', flag: '🇧🇴' },
  // Europa
  'France': { pt: 'França', flag: '🇫🇷' },
  'England': { pt: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'Spain': { pt: 'Espanha', flag: '🇪🇸' },
  'Germany': { pt: 'Alemanha', flag: '🇩🇪' },
  'Portugal': { pt: 'Portugal', flag: '🇵🇹' },
  'Netherlands': { pt: 'Holanda', flag: '🇳🇱' },
  'Italy': { pt: 'Itália', flag: '🇮🇹' },
  'Belgium': { pt: 'Bélgica', flag: '🇧🇪' },
  'Croatia': { pt: 'Croácia', flag: '🇭🇷' },
  'Switzerland': { pt: 'Suíça', flag: '🇨🇭' },
  'Denmark': { pt: 'Dinamarca', flag: '🇩🇰' },
  'Poland': { pt: 'Polônia', flag: '🇵🇱' },
  'Serbia': { pt: 'Sérvia', flag: '🇷🇸' },
  'Austria': { pt: 'Áustria', flag: '🇦🇹' },
  'Ukraine': { pt: 'Ucrânia', flag: '🇺🇦' },
  'Turkey': { pt: 'Turquia', flag: '🇹🇷' },
  // África
  'Morocco': { pt: 'Marrocos', flag: '🇲🇦' },
  'Senegal': { pt: 'Senegal', flag: '🇸🇳' },
  'Ghana': { pt: 'Gana', flag: '🇬🇭' },
  'Nigeria': { pt: 'Nigéria', flag: '🇳🇬' },
  'Cameroon': { pt: 'Camarões', flag: '🇨🇲' },
  'Egypt': { pt: 'Egito', flag: '🇪🇬' },
  'Algeria': { pt: 'Argélia', flag: '🇩🇿' },
  'Tunisia': { pt: 'Tunísia', flag: '🇹🇳' },
  'Ivory Coast': { pt: 'Costa do Marfim', flag: '🇨🇮' },
  // Ásia / Oceania
  'Japan': { pt: 'Japão', flag: '🇯🇵' },
  'South Korea': { pt: 'Coreia do Sul', flag: '🇰🇷' },
  'Australia': { pt: 'Austrália', flag: '🇦🇺' },
  'Iran': { pt: 'Irã', flag: '🇮🇷' },
  'Saudi Arabia': { pt: 'Arábia Saudita', flag: '🇸🇦' },
  'Qatar': { pt: 'Catar', flag: '🇶🇦' },
}

// Nomes alternativos que a API pode usar -> chave canônica acima.
const ALIASES: Record<string, string> = {
  'usa': 'United States',
  'korea republic': 'South Korea',
  'ir iran': 'Iran',
  "côte d'ivoire": 'Ivory Coast',
  'cote d ivoire': 'Ivory Coast',
}

// Marcas de acento (combining diacritics) — regex via string p/ não depender de target ES6.
const ACENTOS = new RegExp('[\\u0300-\\u036f]', 'g')

/** Minúsculas, sem acentos, sem espaços nas pontas. */
export function normalizar(s: string): string {
  return (s ?? '').normalize('NFD').replace(ACENTOS, '').toLowerCase().trim()
}

const LOOKUP = new Map<string, Time>()
for (const [en, v] of Object.entries(MAPA)) LOOKUP.set(normalizar(en), v)
for (const [alias, en] of Object.entries(ALIASES)) {
  const v = MAPA[en]
  if (v) LOOKUP.set(normalizar(alias), v)
}

/** Traduz o nome da API (inglês) para PT. Se não conhecer, devolve o original. */
export function traduzirTime(nomeApi: string): string {
  return LOOKUP.get(normalizar(nomeApi))?.pt ?? nomeApi
}

/** Bandeira (emoji) a partir do nome da API. Fallback: bandeira branca. */
export function bandeiraDe(nomeApi: string): string {
  return LOOKUP.get(normalizar(nomeApi))?.flag ?? '🏳️'
}
