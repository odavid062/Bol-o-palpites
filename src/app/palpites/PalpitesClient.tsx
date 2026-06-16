'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Rodada, Jogo, Palpite } from '@/lib/types'

type RodadaComJogos = Rodada & { jogos: Jogo[] }

type Props = {
  profile: Profile
  rodadas: RodadaComJogos[]
  palpitesIniciais: Palpite[]
}

export default function PalpitesClient({ profile, rodadas, palpitesIniciais }: Props) {
  const supabase = createClient()
  const [palpites, setPalpites] = useState<Record<number, { casa: string; fora: string }>>(
    () => {
      const map: Record<number, { casa: string; fora: string }> = {}
      for (const p of palpitesIniciais) {
        map[p.jogo_id] = { casa: String(p.palpite_casa), fora: String(p.palpite_fora) }
      }
      return map
    }
  )
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [messages, setMessages] = useState<Record<number, string>>({})

  function isTravado(jogo: Jogo) {
    return new Date() >= new Date(jogo.kickoff)
  }

  async function salvar(jogo: Jogo) {
    const p = palpites[jogo.id]
    if (!p || p.casa === '' || p.fora === '') {
      setMessages((m) => ({ ...m, [jogo.id]: 'Preencha os dois placares.' }))
      return
    }
    setSaving((s) => ({ ...s, [jogo.id]: true }))

    const { error } = await supabase.from('palpites').upsert({
      jogo_id: jogo.id,
      participante_id: profile.id,
      palpite_casa: parseInt(p.casa),
      palpite_fora: parseInt(p.fora),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'jogo_id,participante_id' })

    setSaving((s) => ({ ...s, [jogo.id]: false }))
    setMessages((m) => ({
      ...m,
      [jogo.id]: error ? 'Erro ao salvar.' : 'Salvo!',
    }))
    setTimeout(() => setMessages((m) => ({ ...m, [jogo.id]: '' })), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAdmin={profile.is_admin} nome={profile.nome} />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">Meus Palpites</h1>

        {rodadas.length === 0 && (
          <p className="text-gray-500">Nenhuma rodada cadastrada ainda.</p>
        )}

        {rodadas.map((rodada) => (
          <section key={rodada.id}>
            <h2 className="text-lg font-semibold text-green-800 mb-3">
              {rodada.nome}
              {rodada.data && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  {new Date(rodada.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: '2-digit', month: 'long',
                  })}
                </span>
              )}
            </h2>
            <div className="space-y-3">
              {[...rodada.jogos].sort((a, b) =>
                new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
              ).map((jogo) => {
                const travado = isTravado(jogo)
                const p = palpites[jogo.id] ?? { casa: '', fora: '' }
                const kickoffLocal = new Date(jogo.kickoff).toLocaleTimeString('pt-BR', {
                  hour: '2-digit', minute: '2-digit',
                })

                return (
                  <div
                    key={jogo.id}
                    className={`bg-white rounded-xl shadow-sm p-4 border ${
                      travado ? 'border-gray-200 opacity-80' : 'border-green-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl">{jogo.bandeira_casa}</span>
                        <span className="font-medium text-gray-800 truncate">{jogo.time_casa}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          disabled={travado}
                          value={p.casa}
                          onChange={(e) =>
                            setPalpites((prev) => ({
                              ...prev,
                              [jogo.id]: { ...prev[jogo.id] ?? { casa: '', fora: '' }, casa: e.target.value },
                            }))
                          }
                          className="w-14 text-center border rounded-lg py-2 text-lg font-bold disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        <span className="text-gray-400 font-bold">×</span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          disabled={travado}
                          value={p.fora}
                          onChange={(e) =>
                            setPalpites((prev) => ({
                              ...prev,
                              [jogo.id]: { ...prev[jogo.id] ?? { casa: '', fora: '' }, fora: e.target.value },
                            }))
                          }
                          className="w-14 text-center border rounded-lg py-2 text-lg font-bold disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>

                      <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                        <span className="font-medium text-gray-800 truncate text-right">{jogo.time_fora}</span>
                        <span className="text-2xl">{jogo.bandeira_fora}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">
                        {travado ? '🔒 Travado' : `⏰ Fecha às ${kickoffLocal}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {messages[jogo.id] && (
                          <span className={`text-xs ${messages[jogo.id] === 'Salvo!' ? 'text-green-600' : 'text-red-500'}`}>
                            {messages[jogo.id]}
                          </span>
                        )}
                        {!travado && (
                          <button
                            onClick={() => salvar(jogo)}
                            disabled={saving[jogo.id]}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            {saving[jogo.id] ? 'Salvando...' : 'Salvar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
