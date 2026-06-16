import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PalpitesClient from './PalpitesClient'

export default async function PalpitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: rodadas } = await supabase
    .from('rodadas')
    .select('*, jogos(*)')
    .order('numero')

  const { data: palpites } = await supabase
    .from('palpites')
    .select('*')
    .eq('participante_id', user.id)

  return (
    <PalpitesClient
      profile={profile}
      rodadas={rodadas ?? []}
      palpitesIniciais={palpites ?? []}
    />
  )
}
