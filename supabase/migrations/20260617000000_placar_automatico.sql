-- Placar automático ao vivo (football-data.org)
-- Seguro: o trigger fn_apurar_jogo() só apura pontos quando status='encerrado',
-- então atualizar gols com status='ao_vivo' NÃO pontua no meio do jogo.

-- 1) Permitir o status 'ao_vivo' além de 'agendado'/'encerrado'
alter table public.jogos drop constraint if exists jogos_status_check;
alter table public.jogos
  add constraint jogos_status_check
  check (status in ('agendado', 'ao_vivo', 'encerrado'));

-- 2) Vincular cada jogo à partida correspondente na football-data.org
alter table public.jogos add column if not exists api_match_id bigint;
create unique index if not exists jogos_api_match_id_key
  on public.jogos (api_match_id);

comment on column public.jogos.api_match_id is
  'ID da partida na football-data.org (v4). Usado pela rota /api/cron/sync-jogos para atualizar placar ao vivo.';
