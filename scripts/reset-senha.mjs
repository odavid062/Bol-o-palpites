// Reseta a senha de UM usuário do Supabase Auth (sem apagar nada).
// Uso:  node scripts/reset-senha.mjs <email> <novaSenha>
// Ex.:  node scripts/reset-senha.mjs david@bolao2026.local 123456
//
// Usa a SERVICE ROLE do .env.local (Admin API). A senha vem por argumento
// (você digita no terminal) — o script não tem senha embutida.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// carrega o .env.local sem depender de pacote extra
const env = {}
try {
  const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].trim()
  }
} catch {
  console.error('Não achei o .env.local na raiz do projeto.')
  process.exit(1)
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const [email, senha] = process.argv.slice(2)

if (!email || !senha) {
  console.error('Uso: node scripts/reset-senha.mjs <email> <novaSenha>')
  process.exit(1)
}
if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}
if (senha.length < 6) {
  console.error('A senha precisa ter ao menos 6 caracteres (regra do Supabase).')
  process.exit(1)
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

// localizar o usuário pelo email
const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (error) {
  console.error('Erro ao listar usuários:', error.message)
  process.exit(1)
}
const user = data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
if (!user) {
  console.error(`Usuário não encontrado: ${email}`)
  console.error('Emails disponíveis:', data.users.map((u) => u.email).join(', '))
  process.exit(1)
}

const { error: upErr } = await sb.auth.admin.updateUserById(user.id, {
  password: senha,
  email_confirm: true,
})
if (upErr) {
  console.error('Erro ao atualizar senha:', upErr.message)
  process.exit(1)
}

console.log(`✅ Senha de ${email} atualizada. Pode logar agora.`)
