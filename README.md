# Bolão Copa do Mundo 2026

App web para palpites dos placares dos jogos da Copa do Mundo 2026, com ranking ao vivo, apuração de pontos e sincronização automática de placares.

## Stack

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
- **Banco de Dados & Autenticação:** Supabase (Postgres + Auth com e-mail e senha)
- **Estilização:** Tailwind CSS (mobile-first)
- **API Externa:** football-data.org (v4) para placares e status de jogos em tempo real
- **Deploy & Agendamento:** Vercel + Vercel Cron Jobs

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

## Pré-requisitos

- **Node.js** 18.17 ou superior (requisito do Next.js 14)
- **npm** (ou gerenciador de pacotes equivalente)
- Projeto configurado no **Supabase**
- *(Opcional)* Token gratuito da API **football-data.org** para sincronização automática de placares

## Variáveis de ambiente

Copie o arquivo de exemplo para configurar o ambiente local:

```bash
cp .env.example .env.local
```

Variáveis utilizadas pelo sistema (`.env.example`):

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública da instância do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima pública do Supabase |
| `FOOTBALL_DATA_API_KEY` | Token de acesso à API football-data.org para sincronização dos jogos |
| `FOOTBALL_DATA_SEASON` | Temporada da Copa do Mundo na API (padrão: `2026`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta de service role do Supabase (uso restrito ao servidor / cron) |
| `CRON_SECRET` | Token secreto para proteger o endpoint de sincronização (`/api/cron/sync-jogos`) |

> **Atenção:** Nunca compartilhe nem versione arquivos contendo chaves reais (como `.env.local`).

## Instalação e execução local

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. Acesse no navegador: [http://localhost:3000](http://localhost:3000) (redireciona para `/palpites`).

## Scripts disponíveis

Definidos em `package.json`:

- `npm run dev`: Inicia o servidor local Next.js em modo de desenvolvimento.
- `npm run build`: Compila o projeto e gera o build otimizado para produção.
- `npm run start`: Inicia o servidor Next.js em modo de produção.
- `npm run lint`: Executa a verificação estática do código com ESLint.

## Estrutura do projeto

```text
Bol-o-palpites/
├── src/
│   ├── app/
│   │   ├── admin/               # Painel administrativo (criar rodadas, jogos, lançar placares e palpites)
│   │   ├── api/cron/sync-jogos/ # Endpoint de sincronização com football-data.org
│   │   ├── auth/callback/       # Rota de callback do Supabase Auth
│   │   ├── login/               # Autenticação de participantes (login e cadastro com email/senha)
│   │   ├── palpites/            # Tela de palpites por rodada (com trava automática no kickoff)
│   │   ├── ranking/             # Tabela de classificação geral com pódio e premiação
│   │   ├── resultados/          # Placares dos jogos (ao vivo e encerrados) e palpites de todos
│   │   ├── globals.css          # Estilos globais e diretivas do Tailwind CSS
│   │   ├── layout.tsx           # Layout raiz com fontes e metadados
│   │   └── page.tsx             # Redirecionamento da raiz para /palpites
│   ├── components/
│   │   └── Navbar.tsx           # Barra de navegação e menu superior
│   ├── lib/
│   │   ├── supabase/            # Configurações do cliente Supabase (browser, server e middleware)
│   │   ├── football-data.ts     # Integração com a API de partidas football-data.org
│   │   ├── wc-teams.ts          # Normalização de nomes, tradução para PT e bandeiras
│   │   └── types.ts             # Definições de tipos TypeScript do bolão
│   └── middleware.ts            # Proteção de rotas autenticadas e renovação de sessão
├── .env.example                 # Modelo das variáveis de ambiente necessárias
├── next.config.mjs              # Configuração do Next.js
├── package.json                 # Dependências e scripts do projeto
├── tailwind.config.ts           # Configuração de temas e plugins do Tailwind
├── tsconfig.json                # Configurações do compilador TypeScript
└── vercel.json                  # Configuração de agendamento do Vercel Cron
```

## Telas e Rotas

| Rota | Descrição |
|---|---|
| `/login` | Acesso e cadastro de participantes via e-mail e senha |
| `/palpites` | Envio de palpites por rodada (bloqueado individualmente no horário do kickoff) |
| `/ranking` | Tabela geral de classificação com pódio, premiação e pontuação total |
| `/resultados` | Placares reais dos jogos (ao vivo ou encerrados) e palpites detalhados por participante |
| `/admin` | Painel restrito a administradores: criar rodadas, novos jogos, lançar placares manuais e inserir palpites |
| `/api/cron/sync-jogos` | Endpoint protegido por `CRON_SECRET` para sincronização com a API externa de placares |
| `/auth/callback` | Callback para troca de sessão de autenticação do Supabase |

## Como funciona a dinâmica

1. **Cadastro e Acesso:** Participantes criam sua conta ou entram com e-mail e senha em `/login`.
2. **Palpites:** Cada participante insere seus palpites para os jogos da rodada em `/palpites`. O sistema bloqueia palpites automaticamente assim que o jogo atinge o horário de início (`kickoff`).
3. **Placares e Apuração:**
   - **Automático:** A rota `/api/cron/sync-jogos` consome a API da `football-data.org`, vincula as partidas às seleções cadastradas e atualiza status e placar no Supabase.
   - **Manual:** O administrador pode lançar e encerrar jogos diretamente na aba de placares em `/admin`.
4. **Ranking:** Conforme os placares são definidos, a pontuação e as posições em `/ranking` e `/resultados` são recalculadas.

## Sincronização automática (football-data.org)

O sistema conta com sincronização periódica de placares e status:

- **Endpoint:** `GET` ou `POST` em `/api/cron/sync-jogos`.
- **Autenticação:** Header `Authorization: Bearer <CRON_SECRET>` (obrigatório se `CRON_SECRET` estiver configurado).
- **Agendamento:** No `vercel.json`, o cron está configurado para execução a cada 6 horas (`0 */6 * * *`).
- **Mapeamento:** O módulo `src/lib/wc-teams.ts` faz a correspondência automática entre os nomes das seleções em inglês da API e os nomes cadastrados em português com suas respectivas bandeiras.

## Deploy na Vercel

1. Faça push do repositório para o GitHub.
2. Importe o repositório na [Vercel](https://vercel.com/new).
3. Adicione as variáveis de ambiente no dashboard da Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FOOTBALL_DATA_API_KEY`
   - `FOOTBALL_DATA_SEASON` (opcional, padrão `2026`)
   - `CRON_SECRET`
4. Configure a URL de redirect no Supabase Auth:
   - Dashboard do Supabase → Authentication → URL Configuration
   - **Site URL:** `https://seu-app.vercel.app`
   - **Redirect URLs:** `https://seu-app.vercel.app/auth/callback`

## Observações do seed

- **Felyppe** e **Luh** não enviaram palpites da Rodada 1.
- Os nomes **"Assis"** e **"Luciano"** (WhatsApp) precisam ser mapeados para participantes reais — verificar com David.
- Palpites marcados com `(?)` no seed vieram ambíguos — confirmar com os participantes.
