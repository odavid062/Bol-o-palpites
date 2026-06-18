// Backup (somente leitura) do bolão para um arquivo JSON na raiz do projeto.
// Uso: node scripts/backup-bolao.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const env = {}
for (const l of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].trim()
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const out = { exported_at: new Date().toISOString() }
for (const t of ['profiles', 'rodadas', 'jogos', 'palpites']) {
  const { data, error } = await sb.from(t).select('*')
  out[t] = error ? { error: error.message } : data
}
const file = `backup-bolao-${new Date().toISOString().slice(0, 10)}.json`
writeFileSync(new URL('../' + file, import.meta.url), JSON.stringify(out, null, 2))
console.log(`✅ Backup salvo: ${file}  | profiles: ${out.profiles?.length} | palpites: ${out.palpites?.length}`)
