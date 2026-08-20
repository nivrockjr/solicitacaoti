# Contribuindo

Este documento descreve as convenções técnicas do projeto. Antes de abrir um PR ou alterar arquitetura, leia tudo aqui.

---

## Stack

- React 18 + Vite 5 + TypeScript (strict mode ligado).
- Tailwind 3 + Radix UI via shadcn/ui.
- TanStack Query v5 com `staleTime: 0` global.
- Supabase (PostgreSQL + Storage) com RLS.
- Auth custom: bcrypt via `pgcrypto` + funções SQL `SECURITY DEFINER`.
- Build estático servido por Apache. Sem Node.js no servidor.

---

## Princípios

### Zero-overengineering
Sistema interno, mono-operador, tráfego previsível. Soluções de "alto tráfego" (paginação massiva em memória, cache local agressivo, queue, edge workers) só com aprovação explícita.

> Páginas que carregam o conjunto completo (`pageSize: 1000`) são aceitáveis enquanto `solicitacoes` ficar abaixo de ~5.000 linhas. Reavaliar quando passar de 3.000.

### Consistência em tempo real
`staleTime: 0` é decisão de produto. Leitura síncrona direta do Supabase é prioridade — UX instantânea, ignorando economia microscópica de requests.

### Static build
Toda solução proposta tem que rodar como SPA estático com `.htaccess`. Sem SSR, ISR, API Routes ou qualquer recurso que dependa de runtime Node.

---

## Camada de serviços

Toda lógica de negócio fica em `src/services/`. Componentes React não fazem chamada direta ao Supabase.

| Service | Responsabilidade |
|---|---|
| `requestService` | CRUD de solicitações + cálculo de SLA |
| `userService` | gestão de usuários (via funções `admin_*` no banco) |
| `notificationService` | leitura/marcação de notificações |
| `storageService` | upload/download de anexos (signed URLs) |
| `userSettingsService` | preferências do usuário |
| `infrastructureService` | saúde da sessão e logs |
| `preventiveMaintenanceService` | criação semestral de chamados de manutenção |

---

## Padrões de código

### Tipagem
- `any` proibido em código novo. Use `unknown`, generics ou interfaces de `@/types`.
- `catch (error)` deve tipar via `(error as Error).message`.
- TS strict, `noImplicitAny`, `noUnusedLocals` e `noUnusedParameters` estão ligados — build quebra se relaxar.

### UI
- Textos de status, prioridade e tipo passam por `translate(category, value)` de `@/lib/utils`. Nada hardcoded.
- Ícones vêm de `getSemanticIcon(name, props)`. Importar de `lucide-react` direto fora de `lib/utils.ts` e `components/ui/` é proibido.
- Cores via tokens (`text-primary`, `bg-destructive`, `text-warning`, etc.). Hex inline em JSX é proibido (exceções: Canvas API).
- Variants do `Badge`/`Button` via `cva`, não classes inline.

### Logs
`console.*` deve estar dentro de `if (!import.meta.env.PROD) { ... }`. Logs em produção são proibidos.

### Acesso ao Supabase
Apenas `src/services/` chama `supabase.from(...)`, `supabase.rpc(...)` ou `supabase.storage`. Pages, components e contexts consomem services.

---

## Vocabulário canônico

Banco e código em **inglês**. Tradução só na UI via `translate()`.

Tipos canônicos em `src/types/index.ts`:

- `RequestType`: `general | systems | ajuste_estoque | employee_lifecycle | equipment_request | preventive_maintenance | other`
- `RequestPriority`: `low | medium | high`
- `RequestStatus`: `new | assigned | in_progress | resolved | closed | reopened | cancelled | rejected`
- `UserRole`: `requester | admin`
- `NotificationType`: união fechada de 12 valores (ver `types/index.ts`).

Para mapear status → tipo de notificação use `buildRequestNotificationType(status)` (garante exhaustividade).

---

## SLAs

Cálculo em `requestService.calculateDeadline`, em horas corridas. Tipos fora desta lista lançam erro — sem fallback silencioso.

| Tipo | Prazo |
|---|---|
| `general` | 120h (5 dias) |
| `systems` | 240h (10 dias) |
| `equipment_request` | 240h (10 dias) |
| `employee_lifecycle` | 120h (5 dias) |
| `preventive_maintenance` | 960h (40 dias) |
| `ajuste_estoque` | 72h (3 dias) |

> Desconto de finais de semana e feriados é roadmap futuro, não bug.

---

## Banco de dados

Operações privilegiadas passam por funções SQL `SECURITY DEFINER`:

- `validate_login(email, password)` — autenticação. Único caminho que toca `senha_hash`.
- `update_user_password(user_id, password)` — reset administrativo de senha.
- `admin_create_user(...)`, `admin_update_user(...)`, `admin_delete_user(...)` — gestão de usuários (valida internamente que quem chama é `role='admin'`).
- `notify_list_mine(user_id, days)`, `notify_mark_read(user_id, notif_id)`, `notify_mark_all_read(user_id)` — notificações com filtro por dono.
- `gerar_id_solicitacao(date)` + trigger `before_insert_solicitacao` — geram id no formato `DDMMYYNNNNN`.
- `criar_manutencao_preventiva_em_lote()` — disparada manualmente em 01/03 e 01/09.

RLS apertado em `usuarios` e `notificacoes` (anon não pode INSERT/UPDATE/DELETE direto). `solicitacoes` mantém policies abertas — mono-operador, escala baixa, sem PII sensível.

---

## Cloudflare Worker (`whatsapp-worker/`)

O Worker é **híbrido**: hospeda o fluxo de notificações da TI e um fluxo de vendedores de outro sistema no mesmo número de WhatsApp. Ambos compartilham o `index.js` como roteador.

| Arquivo | Escopo | Pode modificar? |
|---|---|---|
| `src/index.js` | Roteador + fluxo TI | Sim, com cuidado (afeta os dois fluxos) |
| `src/vendedores.js` | Fluxo de vendedores (outro sistema) | **Não** — fora do escopo do projeto TI |
| `wrangler.toml` | Configuração do Worker | Sim, com aprovação |

### Regras ao modificar

- **Nunca altere** `vendedores.js` nem a lógica de despacho para vendedores em `index.js` (linhas que chamam `handleVendedoresConversationalFlow`).
- A pasta pode conter `.md` com documentação interna sensível (IPs, infra, schema). Esses arquivos estão protegidos pelo `.gitignore` e **não devem ser commitados**.
- Secrets são gerenciados exclusivamente via `npx wrangler secret put <NOME>`. Nunca hardcode credenciais.

### Deploy

```bash
cd whatsapp-worker
npx wrangler deploy
```

### Operação no dia a dia

Rodar sempre de dentro de `whatsapp-worker/`:

| Para | Comando |
|---|---|
| Confirmar login e conta | `npx wrangler whoami` |
| Ver o que está publicado | `npx wrangler deployments list` |
| **Log ao vivo** (resolve qualquer dúvida) | `npx wrangler tail whatsapp-bot-ti` |
| Nomes dos secrets (nunca os valores) | `npx wrangler secret list` |
| Validar sem publicar | `npx wrangler deploy --dry-run` |
| Voltar versão | `npx wrangler rollback` |

**O login OAuth expira sem avisar.** Venceu em 05/06/2026 e ninguém percebeu — o Worker continuou no ar, mas o terminal perdeu o acesso, o que dá a falsa impressão de projeto abandonado. Se `whoami` reclamar, `npx wrangler login`. Para uso não-interativo, use um API Token em `CLOUDFLARE_API_TOKEN`.

**Não há `package.json` nesta pasta**, então cada `npx wrangler` busca a versão mais recente do registro — o que já falhou na prática. Se atrapalhar, fixe: `npx wrangler@4.124.0 <comando>`.

Dados de operação que não podem ser versionados (endereço público do Worker, número do bot, id da conta) estão em `whatsapp-worker/OPERACAO.local.md`, coberto pela regra `whatsapp-worker/*.md` do `.gitignore`.

### Como desligar

Em ordem de alcance:

1. **Uma pessoa** — apagar o WhatsApp dela na tela de Usuários. O Worker checa e sai limpo. Instantâneo, sem deploy.
2. **Todo o fluxo de TI** — desativar o webhook no painel do Supabase (*Database → Webhooks*). Instantâneo, sem deploy, e **não afeta o fluxo de vendedores**, que entra por outra rota. É o disjuntor geral.
3. **Emergência** — `npx wrangler rollback` reverte o Worker inteiro, vendedores incluídos.

**Nunca** remova a inscrição do webhook no painel da Meta: derruba junto o sistema de vendedores.

### Vocabulário duplicado (atenção ao mexer)

O Worker roda fora do bundle React, então mantém **cópia própria** das traduções de status, tipo e prioridade (`src/index.js`, mapas `statusMap`/`typeMap`/`priorityMap`). Elas já divergem do app: `resolved` aparece como "Resolvida" na tela (`src/lib/utils.ts`) e como "Concluída ✅" no WhatsApp, e o Worker tem uma prioridade `urgent` que não existe em `RequestType`. Ao mexer em `src/lib/utils.ts`, verifique as duas.

A formatação das mensagens também depende do **texto literal** gravado pelos formulários — o Worker procura por "Setor:", "Lotes:", "Ação:" e outros para aplicar negrito. Renomear um rótulo no formulário quebra a formatação sem gerar erro.

### Dependência externa

O fluxo TI depende de um **webhook configurado no painel do Supabase** (Database → Webhooks) que dispara um `POST` para a rota `/supabase-webhook` do Worker a cada `INSERT` ou `UPDATE` na tabela `solicitacoes`. Sem esse webhook, as notificações WhatsApp não são enviadas.

---

## Como propor mudança

Antes de uma refatoração ou novo módulo:

1. **Identificar o problema** — causa raiz ou requisito real.
2. **Estimar o impacto** — quais rotas, services, componentes serão afetados.
3. **Justificar a abordagem** — por que não fere zero-overengineering nem real-time consistency.
4. **Oferecer a versão mínima** — sempre que possível, alternativa menor da mesma solução.

PRs devem ser **atômicos**. Reescritas completas de arquivos funcionais só com aprovação prévia.

---

## Comandos úteis

```bash
npm run dev       # dev server
npm run build     # build de produção
npm run lint      # ESLint (precisa estar limpo)
npm run preview   # preview do build
npx tsc --noEmit -p tsconfig.app.json   # type-check
```

Antes de qualquer commit: `tsc --noEmit` + `npm run lint` + `npm run build` precisam passar limpos.
