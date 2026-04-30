# Histórico de mudanças

Registro cronológico das alterações relevantes do projeto. Datas em formato `AAAA-MM-DD`.

Formato inspirado em [Keep a Changelog](https://keepachangelog.com/), adaptado para o ciclo de mono-operador (sem semver formal).

---

## 2026-04-30 — Segurança do banco e refatoração estrutural

Ciclo intenso. Banco de dados auditado e blindado; frontend decomposto em pedaços menores.

### Banco de dados

- **Vocabulário canônico** — 18 linhas legadas em PT-BR (`'alta'`, `'sistemas'`, `'atribuida'`, etc.) migradas para EN-US. Função SQL `criar_manutencao_preventiva_em_lote` corrigida para gravar EN-US e prazo de 40 dias (alinhado ao SLA do frontend). Função `criar_solicitacao_customizada` deletada (zero callers).
- **Constraints** — `solicitacoes.type/priority/status` ganharam `NOT NULL`. Banco passa a rejeitar chamado vazio.
- **Storage** — buckets `anexos-solicitacoes` e `guideit` ganharam `file_size_limit: 10 MB` e whitelist de MIME (PDF, imagens, Office, ZIP). Policies zumbis do `storage.objects` removidas.
- **Hash de senhas (bcrypt)** — coluna `usuarios.senha` (texto plano) substituída por `usuarios.senha_hash` (bcrypt via `pgcrypto`). 26 senhas migradas. Funções `validate_login(email, password)` e `update_user_password(user_id, password)` criadas como `SECURITY DEFINER`.
- **RLS apertado em `usuarios`** — INSERT e UPDATE bloqueados para anon. Operações privilegiadas passam por `admin_create_user`, `admin_update_user`, `admin_delete_user` (todas `SECURITY DEFINER`, todas validam `role='admin'` internamente). SELECT permanece aberto (sistema interno fechado, baixo risco).
- **RLS apertado em `notificacoes`** — SELECT e UPDATE bloqueados para anon. Operações via `notify_list_mine(user_id, days)`, `notify_mark_read(user_id, notif_id)` e `notify_mark_all_read(user_id)`. INSERT mantido aberto (necessário para o fluxo de notificação automática).
- **Policy zumbi** `Admin pode ver todos os usuários` removida (dependia de `auth.uid()` que é sempre `NULL` com auth custom).

### Frontend

- **Tipos canônicos limpos** — `RequestType`, `RequestPriority`, `RequestStatus` reduzidos para apenas EN-US. Literais PT-BR `@deprecated` removidos. Comparações duplas (`=== 'high' || === 'alta'`) eliminadas.
- **Bug-fix em relatórios** — filtros `'rejeitada'` / `'resolvida'` em `ReportsPage` (que nunca disparavam, dropdown emitia EN-US) trocados pelos valores corretos.
- **`AuthContext.login`** agora chama RPC `validate_login`. Senha em texto plano nunca trafega de volta. Mensagem unificada *"Email ou senha incorretos"* (sem distinguir email-inexistente de senha-errada).
- **Senha definida pelo admin** na criação de usuário — campo `password` no formulário em vez do hardcoded `'senha123'`.
- **Campo de senha removido** do tipo `UsuarioRow` e função `getUsuarioRowByEmail` deletada (substituída por `validateLogin` na autenticação).
- **Decomposição estrutural de páginas grandes:**
  - `RequestDetailPage.tsx`: 1.633 → 1.187 linhas (–27%). Extraídos 5 modais (Reject, ExtendDeadline, EditDelivery, Resolution, DeleteRequest) e 5 sections (LifecycleSection, RequestHeader, RequestSidebar, RequestComments, RequestAttachments).
  - `UsersPage.tsx`: 693 → 423 linhas (–39%). Extraídos 4 dialogs.
  - `LifecycleRequestForm.tsx`: 585 → 317 linhas (–46%). Extraídas 5 seções + schema compartilhado.
  - `StockAdjustmentPage.tsx`: 490 → 403 linhas (–18%). Extraído `ProductLotsBlock`.
  - `AcceptancePage.tsx`: 765 → 601 linhas (–21%). Extraído `AcceptanceTermsContent`.
- **"Marcar todas como lidas"** — botão discreto adicionado ao painel de notificações.
- **Sidebar mobile fecha automaticamente** ao clicar num item.

---

## 2026-04-29 — Saneamento arquitetural e Strict TS

- **TypeScript strict ligado** (`strict: true`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`). Build começa a quebrar se houver `any` ou variável não usada.
- **Camada de serviços completada** — criados `userService`, `storageService`, `userSettingsService`. ~23 chamadas Supabase diretas em components/contexts/pages migradas para a camada.
- **Façade `apiService.ts` removida**. Consumidores passam a importar de `requestService` direto. `holidayService.ts` deletado (tabela `feriados` não existia, zero uso real).
- **Vocabulário canônico nos tipos** — `RequestStatus` agora inclui `'rejected'`. `NotificationType` virou união literal de 12 valores. Comparadores defensivos contra dados PT-BR foram mantidos como `@deprecated` (removidos depois, em 30/04).
- **SLAs declarativos** em `requestService.ts`. Tipos desconhecidos lançam erro — sem fallback silencioso.
- **Hardcodes** ("Nivaldo", UUID do "Eugênio") extraídos para `src/config/adminAssignments.ts` e `src/config/specialUsers.ts`.
- **Vitrine UI** — zero imports diretos de `lucide-react` em código de domínio (uso obrigatório de `getSemanticIcon`). Zero hex inline em JSX. Cores migradas para tokens semânticos (`destructive`, `success`, `warning`, `primary`).
- **Limpeza** — ~640 linhas de código morto removidas: 4 componentes UI sem callers, imports órfãos, boilerplate do CRA em `App.css`, diretivas `"use client"` inúteis (não é Next.js).
- **Bug-fixes funcionais** — `<Toaster />` passou a ser renderizado em `App.tsx`; mismatch de coluna em `SettingsPage` corrigido; `uploadFile` com path errado; `meta.onError` morto em `useRobustQuery`.
- **Brechas de exposição reduzidas** — `window.supabase = supabase` removido de `lib/supabase.ts`. URL do projeto migrada para `import.meta.env.VITE_SUPABASE_URL`.
- **Dependências** — `jspdf 3 → 4` e `uuid 11 → 14` (fecha 11 advisories críticos). `xlsx` documentado como risco aceito (sem fix no npm; vulnerabilidades só disparam em PARSE de xlsx, e este sistema apenas escreve).

---

## 2026-04-24 — Release v1.2 e governança

- **Release v1.2 — sistema estável.**
- Documentação elevada (README, CONTRIBUTING, CLAUDE iniciais).
- `npm audit fix` não-breaking aplicado.

---

## Referências

- Convenções de código: [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Instruções para o Claude Code: [`CLAUDE.md`](./CLAUDE.md)
- Histórico atômico de cada commit: `git log --oneline` na raiz do repo.
