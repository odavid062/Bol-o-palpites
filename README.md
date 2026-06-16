# Bolão Copa do Mundo 2026

App web para 14 amigos palpitarem os placares dos jogos, com ranking ao vivo e apuração automática de pontos.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** (Postgres + Auth via magic link)
- **Tailwind CSS** — mobile-first
- **Deploy:** Vercel

## Premiação

| Posição | Prêmio |
|---|---|
| 🥇 1º lugar | R$ 300,00 |
| 🥈 2º lugar | R$ 200,00 |
| 🥉 3º lugar | R$ 100,00 |

## Regras de pontuação

- Placar **exato** cravado = **3 pontos**
- Qualquer outro resultado = **0 pontos**

> A regra alternativa (só acertar vencedor/empate) está comentada na função `calcular_pontos` no Supabase — basta trocar.

## Setup local

### 1. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha com as credenciais do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

## Deploy na Vercel

1. Faça push do repositório para o GitHub
2. Importe o projeto na [Vercel](https://vercel.com/new)
3. Adicione as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Configure a URL de redirect no Supabase Auth:
   - Dashboard → Authentication → URL Configuration
   - **Site URL:** `https://seu-app.vercel.app`
   - **Redirect URLs:** `https://seu-app.vercel.app/auth/callback`

## Como usar a cada rodada

1. **Admin** cria a rodada e cadastra os jogos com horário de kickoff
2. **Participantes** entram pelo magic link (e-mail) e palpitam antes do jogo começar — o sistema trava automaticamente no kickoff
3. Após cada jogo, o **admin** lança o placar real → pontos e ranking atualizam na hora
4. No fim da Copa, o 1º do ranking acumulado leva o prêmio

## Telas

| Rota | Descrição |
|---|---|
| `/login` | Acesso via magic link (e-mail) |
| `/palpites` | Palpitar os jogos (trava no kickoff) |
| `/ranking` | Tabela geral com pódio e premiação |
| `/resultados` | Placares reais + palpites de cada participante |
| `/admin` | Criar rodadas/jogos, lançar placares, inserir palpites por participante |

## Observações do seed

- **Felyppe** e **Luh** não enviaram palpites da Rodada 1
- Os nomes **"Assis"** e **"Luciano"** (WhatsApp) precisam ser mapeados para participantes reais — verificar com David
- Palpites marcados com `(?)` no seed vieram ambíguos — confirmar com os participantes

## Fase 2 (não implementada)

Integração automática com API de placares (football-data.org ou TheSportsDB) via Supabase Edge Function em cron — puxa resultados em tempo real durante as janelas de jogo e dispara a apuração automaticamente.
