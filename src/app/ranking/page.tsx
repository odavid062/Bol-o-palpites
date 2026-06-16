import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

const PREMIOS = [
  { pos: 1, emoji: '🥇', label: '1º lugar', valor: 'R$ 300,00' },
  { pos: 2, emoji: '🥈', label: '2º lugar', valor: 'R$ 200,00' },
  { pos: 3, emoji: '🥉', label: '3º lugar', valor: 'R$ 100,00' },
]

export const revalidate = 0

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: ranking } = await supabase
    .from('ranking')
    .select('*')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAdmin={profile.is_admin} nome={profile.nome} />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Ranking</h1>

        <div className="bg-green-800 text-white rounded-xl p-4 mb-6 flex justify-around text-center">
          {PREMIOS.map((p) => (
            <div key={p.pos}>
              <div className="text-2xl">{p.emoji}</div>
              <div className="text-xs font-medium mt-1">{p.label}</div>
              <div className="text-sm font-bold">{p.valor}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">Participante</th>
                <th className="px-4 py-3 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody>
              {(ranking ?? []).map((row, i) => {
                const isMe = row.id === user.id
                return (
                  <tr
                    key={row.id}
                    className={`border-t ${isMe ? 'bg-green-50' : ''} ${i % 2 === 0 && !isMe ? '' : ''}`}
                  >
                    <td className="px-4 py-3 font-bold text-gray-400">
                      {row.posicao === 1 ? '🥇' : row.posicao === 2 ? '🥈' : row.posicao === 3 ? '🥉' : row.posicao}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {row.nome}
                      {isMe && <span className="ml-2 text-xs text-green-600 font-normal">(você)</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      {row.total_pontos}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">Placar exato = 3 pts · Empate desempata por ordem alfabética</p>
      </main>
    </div>
  )
}
