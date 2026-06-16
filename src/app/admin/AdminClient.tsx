'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Rodada, Jogo } from '@/lib/types'
import { useRouter } from 'next/navigation'

type RodadaComJogos = Rodada & { jogos: Jogo[] }
type Participante = Pick<Profile, 'id' | 'nome'>

type Props = {
  profile: Profile
  rodadas: RodadaComJogos[]
  participantes: Participante[]
}

export default function AdminClient({ profile, rodadas: initialRodadas, participantes }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [rodadas] = useState(initialRodadas)
  const [tab, setTab] = useState<'rodadas' | 'jogos' | 'placares' | 'palpites'>('placares')

  // Criar rodada
  const [novaRodada, setNovaRodada] = useState({ nome: '', numero: '', data: '' })
  const [criadoRodada, setCriadoRodada] = useState('')

  // Criar jogo
  const [novoJogo, setNovoJogo] = useState({
    rodada_id: '',
    time_casa: '', bandeira_casa: '',
    time_fora: '', bandeira_fora: '',
    kickoff: '',
  })
  const [criadoJogo, setCriadoJogo] = useState('')

  // Lançar placar
  const [placar, setPlacar] = useState<Record<number, { casa: string; fora: string }>>({})
  const [salvandoPlacar, setSalvandoPlacar] = useState<Record<number, boolean>>({})

  // Palpite por participante
  const [palpiteAdmin, setPalpiteAdmin] = useState({
    jogo_id: '', participante_id: '', casa: '', fora: '',
  })
  const [msgPalpiteAdmin, setMsgPalpiteAdmin] = useState('')

  async function criarRodada() {
    const { error } = await supabase.from('rodadas').insert({
      nome: novaRodada.nome,
      numero: parseInt(novaRodada.numero),
      data: novaRodada.data || null,
    }).select().single()
    if (error) { setCriadoRodada('Erro: ' + error.message); return }
    setCriadoRodada('Rodada criada!')
    router.refresh()
  }


  async function criarJogo() {
    const { error } = await supabase.from('jogos').insert({
      rodada_id: parseInt(novoJogo.rodada_id),
      time_casa: novoJogo.time_casa,
      time_fora: novoJogo.time_fora,
      bandeira_casa: novoJogo.bandeira_casa || null,
      bandeira_fora: novoJogo.bandeira_fora || null,
      kickoff: novoJogo.kickoff,
    })
    if (error) { setCriadoJogo('Erro: ' + error.message); return }
    setCriadoJogo('Jogo criado!')
    router.refresh()
  }

  async function lancarPlacar(jogoId: number) {
    const p = placar[jogoId]
    if (!p || p.casa === '' || p.fora === '') return
    setSalvandoPlacar((s) => ({ ...s, [jogoId]: true }))
    const { error } = await supabase.from('jogos').update({
      gols_casa: parseInt(p.casa),
      gols_fora: parseInt(p.fora),
      status: 'encerrado',
    }).eq('id', jogoId)
    setSalvandoPlacar((s) => ({ ...s, [jogoId]: false }))
    if (!error) router.refresh()
  }

  async function salvarPalpiteAdmin() {
    if (!palpiteAdmin.jogo_id || !palpiteAdmin.participante_id) return
    const { error } = await supabase.from('palpites').upsert({
      jogo_id: parseInt(palpiteAdmin.jogo_id),
      participante_id: palpiteAdmin.participante_id,
      palpite_casa: parseInt(palpiteAdmin.casa),
      palpite_fora: parseInt(palpiteAdmin.fora),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'jogo_id,participante_id' })
    setMsgPalpiteAdmin(error ? 'Erro: ' + error.message : 'Palpite salvo!')
  }

  const allJogos = rodadas.flatMap((r) => r.jogos.map((j) => ({ ...j, rodadaNome: r.nome })))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isAdmin={profile.is_admin} nome={profile.nome} />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Painel Admin</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['placares', 'palpites', 'jogos', 'rodadas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-green-700 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              {t === 'placares' ? '⚽ Lançar Placares' : t === 'palpites' ? '✏️ Palpite p/ Participante' : t === 'jogos' ? '+ Jogo' : '+ Rodada'}
            </button>
          ))}
        </div>

        {/* LANÇAR PLACARES */}
        {tab === 'placares' && (
          <div className="space-y-3">
            {allJogos.length === 0 && <p className="text-gray-500">Nenhum jogo cadastrado.</p>}
            {allJogos.map((jogo) => (
              <div key={jogo.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-sm text-gray-500">{jogo.rodadaNome}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    jogo.status === 'encerrado' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                  }`}>
                    {jogo.status === 'encerrado' ? 'Encerrado' : 'Agendado'}
                  </span>
                </div>
                <div className="flex items-center gap-3 my-2 font-medium text-gray-800">
                  <span>{jogo.bandeira_casa} {jogo.time_casa}</span>
                  {jogo.status === 'encerrado' ? (
                    <span className="font-bold text-gray-900">{jogo.gols_casa} × {jogo.gols_fora}</span>
                  ) : (
                    <span className="text-gray-400">×</span>
                  )}
                  <span>{jogo.time_fora} {jogo.bandeira_fora}</span>
                </div>
                {jogo.status !== 'encerrado' && (
                  <div className="flex items-center gap-2 mt-2">
                    <input type="number" min={0} placeholder="0"
                      value={placar[jogo.id]?.casa ?? ''}
                      onChange={(e) => setPlacar((p) => ({ ...p, [jogo.id]: { ...p[jogo.id] ?? { casa:'', fora:'' }, casa: e.target.value }}))}
                      className="w-14 border rounded-lg px-2 py-1 text-center font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <span className="text-gray-400">×</span>
                    <input type="number" min={0} placeholder="0"
                      value={placar[jogo.id]?.fora ?? ''}
                      onChange={(e) => setPlacar((p) => ({ ...p, [jogo.id]: { ...p[jogo.id] ?? { casa:'', fora:'' }, fora: e.target.value }}))}
                      className="w-14 border rounded-lg px-2 py-1 text-center font-bold focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <button
                      onClick={() => lancarPlacar(jogo.id)}
                      disabled={salvandoPlacar[jogo.id]}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded-lg font-medium disabled:opacity-50"
                    >
                      {salvandoPlacar[jogo.id] ? 'Salvando...' : 'Encerrar'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PALPITE POR PARTICIPANTE */}
        {tab === 'palpites' && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Inserir palpite em nome de participante</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Jogo</label>
                <select
                  value={palpiteAdmin.jogo_id}
                  onChange={(e) => setPalpiteAdmin((p) => ({ ...p, jogo_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Selecione…</option>
                  {allJogos.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.bandeira_casa} {j.time_casa} × {j.time_fora} {j.bandeira_fora}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Participante</label>
                <select
                  value={palpiteAdmin.participante_id}
                  onChange={(e) => setPalpiteAdmin((p) => ({ ...p, participante_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Selecione…</option>
                  {participantes.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Gols casa</label>
                <input type="number" min={0}
                  value={palpiteAdmin.casa}
                  onChange={(e) => setPalpiteAdmin((p) => ({ ...p, casa: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Gols fora</label>
                <input type="number" min={0}
                  value={palpiteAdmin.fora}
                  onChange={(e) => setPalpiteAdmin((p) => ({ ...p, fora: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
            <button
              onClick={salvarPalpiteAdmin}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-sm"
            >
              Salvar palpite
            </button>
            {msgPalpiteAdmin && <p className="text-sm text-green-600">{msgPalpiteAdmin}</p>}
          </div>
        )}

        {/* CRIAR JOGO */}
        {tab === 'jogos' && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Novo Jogo</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Rodada</label>
                <select
                  value={novoJogo.rodada_id}
                  onChange={(e) => setNovoJogo((j) => ({ ...j, rodada_id: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Selecione…</option>
                  {rodadas.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bandeira casa (emoji)</label>
                <input value={novoJogo.bandeira_casa} onChange={(e) => setNovoJogo((j) => ({ ...j, bandeira_casa: e.target.value }))}
                  placeholder="🇧🇷" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time casa</label>
                <input value={novoJogo.time_casa} onChange={(e) => setNovoJogo((j) => ({ ...j, time_casa: e.target.value }))}
                  placeholder="Brasil" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bandeira fora (emoji)</label>
                <input value={novoJogo.bandeira_fora} onChange={(e) => setNovoJogo((j) => ({ ...j, bandeira_fora: e.target.value }))}
                  placeholder="🇦🇷" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Time fora</label>
                <input value={novoJogo.time_fora} onChange={(e) => setNovoJogo((j) => ({ ...j, time_fora: e.target.value }))}
                  placeholder="Argentina" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Kickoff (data/hora local)</label>
                <input type="datetime-local" value={novoJogo.kickoff} onChange={(e) => setNovoJogo((j) => ({ ...j, kickoff: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            </div>
            <button onClick={criarJogo} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-sm">
              Criar jogo
            </button>
            {criadoJogo && <p className="text-sm text-green-600">{criadoJogo}</p>}
          </div>
        )}

        {/* CRIAR RODADA */}
        {tab === 'rodadas' && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Nova Rodada</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Número</label>
                <input type="number" value={novaRodada.numero} onChange={(e) => setNovaRodada((r) => ({ ...r, numero: e.target.value }))}
                  placeholder="2" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nome</label>
                <input value={novaRodada.nome} onChange={(e) => setNovaRodada((r) => ({ ...r, nome: e.target.value }))}
                  placeholder="Rodada 2" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Data (opcional)</label>
                <input type="date" value={novaRodada.data} onChange={(e) => setNovaRodada((r) => ({ ...r, data: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            </div>
            <button onClick={criarRodada} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium text-sm">
              Criar rodada
            </button>
            {criadoRodada && <p className="text-sm text-green-600">{criadoRodada}</p>}
          </div>
        )}
      </main>
    </div>
  )
}
