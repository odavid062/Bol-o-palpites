# ⚽ Placar automático ao vivo (football-data.org)

Atualiza os jogos da Copa 2026 (placar + status) automaticamente, sem precisar lançar na mão no `/admin`.

## Como funciona
```
Agendador (cron)  →  GET /api/cron/sync-jogos
   → busca as partidas da Copa na football-data.org (/v4/competitions/WC/matches)
   → encontra o jogo correspondente na tabela `jogos`
        (por `api_match_id`; senão por nome traduzido + data, e grava o vínculo)
   → atualiza `gols_casa`, `gols_fora` e `status`
```
O status mapeia assim: `IN_PLAY/PAUSED → ao_vivo`, `FINISHED → encerrado`, `SCHEDULED/TIMED → agendado`.

> 🔒 **Pontuação segura:** o trigger `fn_apurar_jogo()` só apura pontos quando `status='encerrado'`.
> Então durante o jogo (`ao_vivo`) o placar atualiza **sem** pontuar. Só pontua no apito final.

## 1) Aplicar a migration
`supabase/migrations/20260617000000_placar_automatico.sql` — adiciona o status `ao_vivo` e a coluna `api_match_id`.
- Via Supabase CLI: `supabase db push`
- Ou cole o SQL no **SQL Editor** do projeto `bolao-copa-2026`.

## 2) Variáveis de ambiente (`.env.local` e na Vercel)
```
FOOTBALL_DATA_API_KEY=...     # token grátis: https://www.football-data.org/client/register
FOOTBALL_DATA_SEASON=2026
SUPABASE_SERVICE_ROLE_KEY=... # Supabase → Project Settings → API (SECRETO!)
CRON_SECRET=...               # valor aleatório p/ proteger a rota
```

## 3) Testar local
```bash
npm run dev
# em outro terminal:
curl -H "Authorization: Bearer SEU_CRON_SECRET" http://localhost:3000/api/cron/sync-jogos
```
Resposta esperada: `{ "ok": true, "totalApi": N, "atualizados": X, "vinculados": Y, "semCorrespondencia": Z }`.
- `vinculados` = jogos que casaram com a API pela 1ª vez (gravou `api_match_id`).
- `semCorrespondencia` = partidas da API sem jogo cadastrado (cadastre no `/admin` ou veja o roadmap v2).

## 4) Agendar (importante — limite da Vercel grátis)
O plano **Hobby da Vercel** limita a frequência do Cron Job. Para atualização **ao vivo** (a cada poucos minutos), use um agendador externo grátis apontando para a rota:

**Opção A — cron-job.org (grátis, simples):**
- URL: `https://SEU-APP.vercel.app/api/cron/sync-jogos`
- Header: `Authorization: Bearer SEU_CRON_SECRET`
- Intervalo: a cada 2–3 min nos dias de jogo.

**Opção B — Supabase pg_cron + pg_net** (grátis): agenda um job no Postgres que dá `net.http_get` na rota.

O `vercel.json` já deixa um cron de fallback a cada 6h (dentro do limite Hobby).

## Vínculo dos jogos
Os jogos continuam sendo cadastrados em PT no `/admin` (ou seed). A 1ª sincronização casa cada jogo com a partida da API por **nome (traduzido) + data** e grava o `api_match_id`; a partir daí o vínculo é direto. O dicionário de seleções fica em `src/lib/wc-teams.ts` (ajuste se algum nome não casar).

## Roadmap (v2)
- **Importar as partidas automaticamente** da API (criar `jogos`/`rodadas` a partir do calendário), eliminando o cadastro manual.
- **Badge "🔴 AO VIVO"** na home/resultados mostrando o placar em andamento (hoje a tela de Resultados só lista `encerrado`).
