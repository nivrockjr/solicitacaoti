# Histórico de mudanças

Registro cronológico das alterações relevantes do projeto. Datas em formato `AAAA-MM-DD`.

Formato inspirado em [Keep a Changelog](https://keepachangelog.com/), adaptado para o ciclo de mono-operador (sem semver formal).

---

## 2026-06-04 — Auditoria e Saneamento Menor

- **Auditoria de segurança das dependências (Dependabot — 6 alertas)** — Avaliados os 6 alertas abertos cruzando severidade com o uso real (SPA estático, sem Node no servidor). Corrigido o único com fix barato e de valor real: `react-router-dom` 6.30.3 → 6.30.4 (patch), fechando o alerta de open redirect (não explorável no uso atual — todos os `navigate()` usam rotas fixas — mas correção trivial e segura). Os outros 5 foram analisados e aceitos como risco baixo/nulo: `xlsx` ×2 (altos, sem fix no npm; o sistema só escreve, nunca parseia, e os CVEs só disparam em parse); `ws` (transitiva do Supabase realtime, não roda no browser, que usa WebSocket nativo); `esbuild` e `vite` (apenas dev-server local; o fix exigiria subir o Vite para a major 6, desproporcional). `tsc`, `lint` e `build` limpos.
- **Extração da lógica do `RequestDetailPage` para um hook (Fase D — Passos D1–D3)** — Continuação da auditoria do componente. (D1) Os três blocos repetidos de upload de anexos viraram o helper `uploadFilesToAttachments` no `storageService`, preservando a diferença do fluxo de rejeição (tolera falha por arquivo via callback). (D2) Os painéis inline de Resolução/Reaberta/Rejeitada viraram os componentes `ResolutionPanel` e `StatusFlowPanel` (este último parametrizado, eliminando a duplicação entre reaberta e rejeitada). (D3) Todo o estado (28 `useState`), os 2 `useEffect` e os 19 handlers foram movidos para o hook `hooks/use-request-detail.ts`, deixando o componente apenas com apresentação. `RequestDetailPage.tsx`: 1026 → 370 linhas (−69% desde o início da auditoria). Zero mudança de comportamento ou visual; auditado por revisão dupla (própria + subagente em contexto limpo). `tsc`, `lint` e `build` limpos.
- **Reestruturação dos arquivos de instrução de IA (fonte única `AGENTS.md`)** — Adotado o padrão portável `AGENTS.md` (Linux Foundation) como fonte única para qualquer agente de IA (Claude Code, Antigravity, etc.). Migrados para ele o contexto do projeto, as regras de conduta, a higiene de código (10 critérios), a arquitetura proibida e o novo **Norte de design** (estilo Apple, minimalista, anti-slop, ancorado nos tokens reais do sistema). O `CLAUDE.md` foi enxugado (129 → 48 linhas) para um "bilhete fino" que importa `@AGENTS.md` e mantém apenas o que é específico do relacionamento com o Operador (Protocolo de Auditoria, Cláusula de Integridade, Comunicação). Sem perda de regras — apenas redistribuição, sem duplicação. Alinhado às práticas oficiais de Claude Code (CLAUDE.md curto, conhecimento de domínio sob demanda) e ao padrão cross-tool.
- **Deduplicação dos anexos de fluxo (Passo A da auditoria de `RequestDetailPage`)** — O bloco JSX de listagem de anexos (ícone + nome + tamanho + botão "Visualizar") estava escrito três vezes inline nos painéis de Resolução, Reabertura e Rejeição. Extraído para o componente apresentacional `components/requests/sections/AttachmentList.tsx`, parametrizado apenas pelo rótulo. Visual preservado 1:1 (botão `variant="outline"`, sem estado de download). `RequestDetailPage.tsx`: 1193 → 1137 linhas, sem alteração de comportamento ou aparência. `tsc`, `lint` e `build` limpos.
- **Extração do parser de itens de entrega (Passo B da auditoria de `RequestDetailPage`)** — A lógica de parsing (~100 linhas de regex/transformação) do `handleOpenDeliveryModal` foi movida para `utils/delivery-items.ts` como duas funções puras (`extractDeliveryItemsFromOnboarding`, `extractDeliveryItemsFromDescription`), seguindo o precedente de `utils/lifecycle-links.ts`. O handler ficou fino, apenas orquestrando a busca do onboarding de origem e o fallback. A chamada ao service (`getRequestById`) permaneceu na página — `utils/` segue sem I/O. Comportamento idêntico. `RequestDetailPage.tsx`: 1137 → 1068 linhas. `tsc`, `lint` e `build` limpos.
- **Remoção da busca reversa de ciclo de vida não-consumida (Passo C da auditoria de `RequestDetailPage`)** — Eliminado o `useEffect` `fetchRelatedLifecycle` e os dois estados `setRelatedOnboardingReq`/`setRelatedOffboardingReqs` que populavam memória **nunca lida pelo JSX** — código de saída morto que ainda disparava 1 consulta ao Supabase por abertura de chamado de ciclo de vida (contra a política de Egress do Free tier). A exibição de vínculos já é coberta por `extractLifecycleLinks` no `RequestSidebar`. O service `findOffboardingsByOnboardingId` foi mantido (religar no futuro é trivial); apenas o import órfão saiu da página. Sem alteração visual. `RequestDetailPage.tsx`: 1068 → 1026 linhas. `tsc`, `lint` e `build` limpos.

- **Limpeza de código morto** — exclusão de `App.css` (CRA boilerplate sem uso) e das pastas vazias `components/debug/` e `components/email/`.
- **Alinhamento TypeScript** — removidas flags relaxadas (`noImplicitAny: false`, etc.) do `tsconfig.json` raiz para refletir o rigor de `tsconfig.app.json` e evitar mascaramento de erros na IDE.
- **Otimização de Contadores e Paginação (Ponto 5)** — Criada a função RPC `get_requests_counters` no banco para resolver problema crítico de limite de Egress no plano gratuito. Refatorados `AllRequestsPage`, `MyRequestsPage` e `DashboardPage` para eliminar `pageSize: 1000` e buscar dados agregados no servidor, corrigindo também loops de filtragem de approvalStatus (bugfix do 'not_rejected').
- **Auditoria e Limpeza Geral (Ponto 6)** — Projeto auditado através do TypeScript Strict Compiler (`noUnusedLocals: true`). Imports órfãos (`isResolved`, `isPending`, `useMemo`, `ITRequest`) e inconsistências de tipagem de arrays literais de Status foram corrigidas nas listagens (`AllRequestsPage` e `MyRequestsPage`). Sistema atinge estado de "Zero Erros" no compilador.
- **Blindagem de Rotas Administrativas (Ponto 7)** — Implementado o guardião de rotas `RequireAdmin.tsx` no `App.tsx` para proteger fisicamente as rotas `/users` e `/settings`. Redireciona usuários sem a role 'admin' sumariamente para o `/dashboard`.
- **Componentização Extrema do Ajuste de Estoque (Ponto 8)** — "Secagem" da `StockAdjustmentPage.tsx` concluída (de 404 para ~18 linhas). Todo o formulário, lógica de lotes (Zod) e formatação do integrador do WhatsApp foram isolados cirurgicamente no novo componente protegido `StockAdjustmentForm.tsx`.
- **Segurança do Webhook do WhatsApp (Ponto 9)** — Implementação de validação criptográfica HMAC-SHA256 usando Web Crypto API no Cloudflare Worker (`whatsapp-worker/src/index.js`), verificando a assinatura oficial da Meta (`X-Hub-Signature-256`) contra interceptações e envios falsos. Limpeza de documentações legadas e unificação dos fluxos TI e Vendedores no mesmo escopo protegido.

---

## 2026-05-22 — Integração WhatsApp e refinamento visual

- **WhatsApp Cloud API** — Integração ponta-a-ponta com a API oficial da Meta utilizando Cloudflare Workers (`whatsapp-worker`) para intermediar as mensagens sem onerar o frontend.
- **Ações interativas** — Ao resolver um chamado, o sistema envia botões proativos pelo WhatsApp ("Verificado ✅" e "Não Resolvido ❌"). A resposta do usuário cai direto no Supabase validando ou reabrindo o ticket.
- **Automação via Webhooks** — Banco de dados configurado para notificar o Cloudflare a cada mudança de status ou novos comentários, acionando o envio de mensagens em tempo real.
- **Refinamento de UI** — Token de cor `success` no Tailwind alinhado ao hexadecimal oficial de chamados resolvidos (`#22c55e`). Layout do histórico da solicitação ajustado para exibir a assinatura e data exata da validação do usuário via WhatsApp.

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
