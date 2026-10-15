import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export const revalidate = 0

export default async function ResultadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: jogos } = await supabase
    .from('jogos')
    .select('*, rodadas(nome)')
    .in('status', ['encerrado', 'ao_vivo'])
    .order('kickoff', { ascending: false })

  const jogoIds = (jogos ?? []).map((j) => j.id)

  const { data: palpites } = jogoIds.length
    ? await supabase
        .from('palpites')
        .select('*, profiles(nome)')
        .in('jogo_id', jogoIds)
        .order('pontos', { ascending: false })
    : { data: [] }

  type PalpiteRow = NonNullable<typeof palpites>[number]
  const palpitesPorJogo: Record<number, PalpiteRow[]> = {}
  for (const p of palpites ?? []) {
    if (!palpitesPorJogo[p.jogo_id]) palpitesPorJogo[p.jogo_id] = []
    palpitesPorJogo[p.jogo_id]!.push(p)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAdmin={profile.is_admin} nome={profile.nome} />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Resultados</h1>

        {(jogos ?? []).length === 0 && (
          <p className="text-gray-500">Nenhum jogo em andamento ou encerrado ainda.</p>
        )}

        {(jogos ?? []).map((jogo) => {
          const isAoVivo = jogo.status === 'ao_vivo'

          return (
            <div key={jogo.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div
                className={`text-white px-4 py-3 flex items-center justify-between ${
                  isAoVivo ? 'bg-red-700' : 'bg-green-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{(jogo.rodadas as { nome: string })?.nome}</span>
                  {isAoVivo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white text-red-700 uppercase tracking-wide animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      Ao vivo
                    </span>
                  )}
                </div>
                <span className={`text-xs ${isAoVivo ? 'text-red-100 font-medium' : 'text-green-300'}`}>
                  {new Date(jogo.kickoff).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-1 justify-end text-right">
                    <span className="font-semibold text-gray-800">{jogo.time_casa}</span>
                    <span className="text-2xl">{jogo.bandeira_casa}</span>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <div className="text-2xl font-bold text-gray-900">
                      {jogo.gols_casa ?? 0} × {jogo.gols_fora ?? 0}
                    </div>
                    {isAoVivo && (
                      <span className="text-[10px] uppercase font-semibold text-red-600 mt-0.5 tracking-wider">
                        Placar atual
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-start text-left">
                    <span className="text-2xl">{jogo.bandeira_fora}</span>
                    <span className="font-semibold text-gray-800">{jogo.time_fora}</span>
                  </div>
                </div>

                {(palpitesPorJogo[jogo.id] ?? []).length > 0 && (
                  <table className="w-full text-sm border-t pt-2">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase">
                        <th className="py-1 text-left">Participante</th>
                        <th className="py-1 text-center">Palpite</th>
                        <th className="py-1 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(palpitesPorJogo[jogo.id] ?? []).map((p) => (
                        <tr key={p.id} className={`border-t ${p.pontos > 0 ? 'bg-green-50' : ''}`}>
                          <td className="py-1.5 text-gray-700">{(p.profiles as { nome: string } | null)?.nome}</td>
                          <td className="py-1.5 text-center text-gray-600">
                            {p.palpite_casa} × {p.palpite_fora}
                          </td>
                          <td className="py-1.5 text-right font-bold">
                            {isAoVivo ? (
                              <span className="text-xs font-normal text-amber-600">Em jogo</span>
                            ) : p.pontos > 0 ? (
                              <span className="text-green-600">+{p.pontos} 🎯</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
