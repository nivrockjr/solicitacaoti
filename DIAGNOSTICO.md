# 📋 Diagnóstico Final Consolidado — Sistema Online de Solicitação de TI

**Data da auditoria:** 2026-04-28
**Última atualização de status:** 2026-04-29
**Cobertura:** Frontend completo + Backend (Supabase) completo

---

## 📊 Status geral pós-correções (29/04/2026)

Entre 28/04 e 29/04 foram executados **20 lotes de correção** organizados em 6 caixas. Resumo numérico:

| Caixa | Tema | Status | Lotes |
|---|---|---|---|
| ✅ Caixa 1 | Bugs funcionais e robustez | **9/9 (100%)** | 1–4 |
| ✅ Caixa 2 | Limpeza e código morto | **7/7 (100%)** | 5–7 |
| ✅ Caixa 3 | Hardcodes / configuração | **10/10 (100%)** | 8–10 |
| ✅ Caixa 4 | Tipagem / nível médio | **7/7 (100%)** | 11–13 |
| ✅ Caixa 5 | Refatoração arquitetural | **3/3 (100%)** | 14–16 |
| ✅ Caixa 6 | Vitrine UI (ícones, cores) | **4/4 (100%)** | 17–20 |
| 🚨 Fase 0 | Segurança do banco | **0/24** | pendente — exige decisão sobre auth |
| 🔴 Refatoração maior | Decompor RequestDetailPage | **0/1** | pendente |

**Itens marcados como ✅ RESOLVIDO neste documento já estão refletidos no código.**

---

## ⚖️ Sobre este documento

- Cada achado declara **O QUE** está errado, **ONDE** está, **COMO** se manifesta, e **POR QUE** é problema, com referência ao **arquivo:linha** ou query SQL que o comprova.
- Onde a base de comparação é uma diretriz interna do projeto, cito a cláusula (`CONTRIBUTING.md § X.Y` ou `CLAUDE.md Diretiva N`).
- Onde a base é documentação oficial pública, cito a fonte ([React](https://react.dev), [TypeScript](https://www.typescriptlang.org/docs/), [Supabase](https://supabase.com/docs), [TanStack Query v5](https://tanstack.com/query/latest), [PostgreSQL](https://www.postgresql.org/docs/current/), [OWASP](https://owasp.org), [LGPD Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)).
- Achados marcados com ⚠️ INFERÊNCIA são derivados do código sem confirmação empírica direta — destacados para você decidir verificar.

---

## 📑 Índice

1. [Resumo executivo](#1-resumo-executivo)
2. [Metodologia e cobertura](#2-metodologia-e-cobertura)
3. [Stack confirmada (versões reais)](#3-stack-confirmada-versões-reais)
4. [Visão geral do banco de dados](#4-visão-geral-do-banco-de-dados)
5. [🚨 Fase 0 — Achados críticos de segurança](#5--fase-0--achados-críticos-de-segurança)
6. [🔴 Bugs funcionais confirmados](#6--bugs-funcionais-confirmados)
7. [🟠 Violações do protocolo interno](#7--violações-do-protocolo-interno)
8. [🟡 Higiene e código morto](#8--higiene-e-código-morto)
9. [📐 Bugs de tipagem (mascarados)](#9--bugs-de-tipagem-mascarados)
10. [🗄️ Achados específicos do banco](#10--achados-específicos-do-banco)
11. [🧭 Ordem segura de execução](#11--ordem-segura-de-execução)
12. [❓ Decisões pendentes do Operador](#12--decisões-pendentes-do-operador)
13. [📚 Referências oficiais consultadas](#13--referências-oficiais-consultadas)

---

# 1. Resumo executivo

O sistema cumpre seu papel funcional principal: 26 usuários (2 admins + 24 solicitantes) registraram **349 solicitações** ao longo de aproximadamente 10 meses, com taxa de resolução de **97%**. A arquitetura básica (React + Vite + Supabase + TanStack Query) está alinhada com a stack declarada.

**No entanto**, a auditoria identificou **três classes** de problemas que precisam de ação:

| Classe | Quantidade | Severidade |
|---|---|---|
| 🚨 Brechas críticas de segurança | 6 | **EMERGÊNCIA** |
| 🔴 Bugs funcionais | 28 | Alta |
| 🟠 Violações do protocolo interno | ~75 | Média |
| 🟡 Higiene / código morto / vitrine | ~60 | Baixa |

A descoberta mais grave: **o banco está aberto para leitura/escrita/deleção anônima** (RLS com policies `USING (true)` em todas as tabelas, mais policies idênticas em Storage). Combinado com **senhas em texto plano** na coluna `usuarios.senha`, isso expõe **toda a base de credenciais e dados** a qualquer pessoa com acesso ao bundle JavaScript público.

**Recomendação:** antes de qualquer refatoração estética ou de tipagem, **a Fase 0 emergencial (Seção 5)** precisa ser resolvida.

---

# 2. Metodologia e cobertura

## 2.1 O que foi auditado linha por linha

### Frontend (47 arquivos)
- **Configuração:** `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.ts`, `vite.config.ts`, `index.html`, `.htaccess`, `App.css`, `index.css`.
- **Documentação:** `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`.
- **Entrypoint:** `src/main.tsx`, `src/App.tsx`.
- **Tipos:** `src/types/index.ts`.
- **Lib:** `src/lib/utils.ts`, `src/lib/supabase.ts`.
- **Services (todos):** `infrastructureService`, `requestService`, `notificationService`, `preventiveMaintenanceService`, `holidayService`, `apiService`, `__tests__/requestService.test.ts`.
- **Contexts:** `AuthContext`, `NotificationContext`, `ThemeContext`.
- **Hooks:** `use-requests-data`, `use-robust-query`, `use-toast`, `use-mobile`.
- **Utils:** `lifecycle-links`, `locale-config`.
- **Config:** `adminAssignments`.
- **Pages (todas):** Index, NotFound, Auth (Login + ResetPassword), Dashboard, Reports, Settings, Users, StockAdjustment, Requests (Acceptance, AllRequests, CicloVida, MyRequests, NewRequest, **RequestDetailPage**).
- **Componentes auth:** LoginForm, ForgotPasswordForm.
- **Componentes layout:** MainLayout, AuthLayout, Navbar, Sidebar.
- **Componentes notifications:** NotificationsList.
- **Componentes requests:** RequestCard, RequestForm, LifecycleRequestForm.
- **Componentes reports:** ReportFilters, exportUtils.
- **Componentes ai:** ChatAssistant.
- **Componentes UI custom:** signature-canvas, evervault-card, evervault-background, border-beam, moving-border, typing-animation, placeholders-and-vanish-input, chart, sonner, toaster, toast.

### Banco de dados (Supabase)
- Schema completo (`information_schema.columns`).
- Constraints (`information_schema.table_constraints`).
- Policies RLS (`pg_policies` em `public` e `storage`).
- Triggers (`information_schema.triggers`).
- Funções customizadas (5 corpos completos via `pg_get_functiondef`).
- Índices (`pg_indexes`).
- Extensões (`pg_extension`).
- Buckets de Storage (`storage.buckets`).
- Distribuição real de dados (`COUNT`/`GROUP BY` em `usuarios`, `solicitacoes`, `notificacoes`).
- Amostra de chamados recentes e dos 51 chamados de manutenção preventiva.

## 2.2 O que NÃO foi auditado
- 54 arquivos boilerplate em `src/components/ui/` derivados do shadcn/ui (avaliação por amostragem só nos arquivos custom).
- Logs do Supabase, métricas de uso, quotas reais.
- O sistema rodando em produção (não foi feito `npm run dev` nem teste de UI ao vivo).
- Edge Functions (não há, mas não foi confirmado por API).
- GRANTs/permissions detalhadas das funções customizadas via `pg_proc.proacl`.

## 2.3 Limites do diagnóstico
- O diagnóstico se baseia no **código presente no disco** em 28/04/2026 e nos **dados reais** consultados via SQL editor naquela data.
- Onde uma decisão de produto não está documentada, marquei como **pergunta pendente** (Seção 12).

---

# 3. Stack confirmada (versões reais)

Confirmado em `package.json`:

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework UI | React | `^18.3.1` |
| Build tool | Vite | `^5.4.1` |
| Linguagem | TypeScript | `^5.5.3` |
| Roteamento | react-router-dom | `^6.26.2` |
| Estado remoto | @tanstack/react-query | `^5.56.2` |
| Backend (BaaS) | @supabase/supabase-js | `^2.50.4` |
| UI primitives | Radix UI (vários `@radix-ui/*`) | 1.x / 2.x |
| Styling | Tailwind CSS | `^3.4.11` |
| Forms | react-hook-form | `^7.53.0` |
| Validação | zod | `^3.23.8` |
| Ícones | lucide-react | `^0.462.0` |
| Animação | framer-motion | `^12.23.9` |
| Datas | date-fns | `^3.6.0` |
| Toast | sonner | `^1.5.0` (instalado) + `@radix-ui/react-toast` `^1.2.1` |
| PDF/XLSX | jspdf, jspdf-autotable, xlsx | 3.0.1 / 5.0.2 / 0.18.5 |

**Importante (descoberta):** `next-themes` (^0.3.0) está instalado e é usado em [`src/components/ui/sonner.tsx:1`](src/components/ui/sonner.tsx#L1) — apesar do projeto **não usar Next.js**. Inconsistência, ver Seção 7.

## 3.1 ⚠️ TypeScript Strict Mode declarado mas DESLIGADO

`README.md § 3` e `CONTRIBUTING.md § 1` declaram: *"TypeScript (Strict Mode)"*.

**Realidade verificada em [`tsconfig.app.json`](tsconfig.app.json):**
```json
"strict": false,
"noUnusedLocals": false,
"noUnusedParameters": false,
"noImplicitAny": false,
"noFallthroughCasesInSwitch": false
```

E em [`tsconfig.json`](tsconfig.json):
```json
"noImplicitAny": false,
"strictNullChecks": false,
"noUnusedLocals": false
```

**Implicação:** vários "bugs" de tipagem detectados nesta auditoria **não geram erro de build hoje** porque o compilador está permissivo. A documentação **mente** sobre o estado real do projeto. Ver [Seção 9](#9--bugs-de-tipagem-mascarados).

**Referência oficial:** [TypeScript Handbook — Strict Family](https://www.typescriptlang.org/tsconfig/#strict).

---

# 4. Visão geral do banco de dados

## 4.1 Inventário

| Tabela | Linhas reais | RLS | PK | Observação |
|---|---|---|---|---|
| `usuarios` | 26 | ✅ ativo | id (uuid) | senha em **texto plano** |
| `solicitacoes` | 349 | ✅ ativo | id `varchar(13)` | volume pequeno, decisão Zero-Overengineering justificada |
| `notificacoes` | 1.702 | ✅ ativo | id (uuid) | polling sem janela de tempo gera 17× I/O por chamado |
| `user_settings` | 1 | ✅ ativo | id (uuid) | praticamente vazia → confirma bug de save |

**Tabela referenciada pelo código mas NÃO existe:** `feriados` (usada em [`src/services/holidayService.ts:5`](src/services/holidayService.ts#L5)).

## 4.2 Buckets de Storage

| Bucket | Público? | file_size_limit | allowed_mime_types |
|---|---|---|---|
| `anexos-solicitacoes` | não | **null** (sem limite) | **null** (qualquer tipo) |
| `guideit` | sim | **null** | **null** |

## 4.3 Extensões instaladas

`pgcrypto`, `uuid-ossp`, `supabase_vault`, `pg_stat_statements`, `pg_graphql`, `plpgsql`.

**Ausentes:** `pg_cron` (não instalado — automação semestral não tem como rodar agendada hoje), `http`/`pg_net` (não instalados).

## 4.4 Distribuição real do vocabulário

Via queries `GROUP BY` em `solicitacoes`:

| Coluna | EN-US (canônico) | PT-BR (legado/regressão) |
|---|---|---|
| `priority` | high (231) / medium (96) / low (12) — **97,1%** | alta (9) / media (1) — **2,9%** |
| `type` | preventive_maintenance (51) / systems (82) / equipment_request (6) / general (13) / ajuste_estoque (196) — **98,6%** | sistemas (3) / solicitacao_equipamento (2) — **1,4%** |
| `status` | new (9) / assigned (1) / in_progress (3) / resolved (338) — **99,4%** | atribuida (2) — **0,6%** |
| `role` (em `usuarios`) | admin (2) / requester (24) — **100%** | — |

## 4.5 ⚠️ Descoberta empírica importante

A amostra B.2 mostra que **PT-BR ainda é gravado HOJE** (chamados criados em 28/04/2026 com `priority='alta'`, `status='atribuida'`). **Não é resíduo histórico congelado** — há fonte ativa gerando isso.

Hipóteses (precisam de verificação):
- Edição manual via SQL Editor pelo admin.
- Alguma página/componente não auditado que grava em PT-BR (improvável — todos os arquivos foram lidos).
- Uma **das 3 funções SQL fantasma** (`criar_solicitacao_customizada`, `criar_manutencao_preventiva_em_lote`) sendo invocada via RPC que ainda não rastreamos.

---

# 5. 🚨 Fase 0 — Achados críticos de segurança

> **Esta seção descreve vulnerabilidades exploráveis HOJE com a `anon key` que está exposta no bundle JavaScript público (qualquer URL HTTPS do sistema serve a `anon key` em texto claro).**

## 5.1 🚨 Senhas em texto plano + leitura pública total da tabela `usuarios`

**Severidade:** Crítica
**Categoria:** Quebra de confidencialidade — viola **OWASP A02:2021 — Cryptographic Failures**, **LGPD Art. 46** (medidas técnicas de proteção).

### O QUE
A coluna `usuarios.senha` armazena senhas em **texto plano** (data_type: `text`, sem hash). Combinada com a policy `"Permitir leitura para todos"` em `usuarios` (`USING true`), qualquer requisição usando a `anon key` retorna **todas as senhas de todos os 26 usuários**.

### ONDE
- Schema: `usuarios.senha text` — confirmado em Bloco 2.1.
- Inserção/uso de plaintext:
  - [`src/contexts/AuthContext.tsx:37-39`](src/contexts/AuthContext.tsx#L37) — `if (data.senha !== senha) throw ...`
  - [`src/pages/Users/UsersPage.tsx:162`](src/pages/Users/UsersPage.tsx#L162) — `senha: 'senha123'` na criação de novos usuários
  - [`src/pages/Users/UsersPage.tsx:223`](src/pages/Users/UsersPage.tsx#L223) — `update({ senha: values.password })` no reset
- Policy RLS aberta — confirmada em Bloco 2.2:
  ```
  Policy: "Permitir leitura para todos"
  Tabela: usuarios | SELECT | USING (true)
  ```

### COMO se explora
```js
// No console de qualquer navegador, em qualquer página do sistema:
const { data } = await window.supabase.from('usuarios').select('*');
console.table(data);
// Retorna nome, email, role, senha (plaintext) de todos os 26 usuários
```

`window.supabase` está literalmente exposto em [`src/lib/supabase.ts:165`](src/lib/supabase.ts#L165): `window.supabase = supabase;`. Mas **mesmo sem isso**, qualquer pessoa com a `anon key` (lida do bundle) consegue fazer a mesma chamada de fora.

### POR QUE é problema
- Comprometimento de **todas as credenciais** com 1 query.
- Promove ataques laterais (reuso de senhas em outros sistemas).
- Viola compliance **LGPD** (a documentação do README declara conformidade).
- Viola **OWASP Top 10 A02:2021** — armazenamento de credenciais sem proteção criptográfica.

### Referências
- [OWASP — Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Supabase Auth docs — Sign in with password](https://supabase.com/docs/guides/auth/passwords)
- [PostgreSQL `pgcrypto`](https://www.postgresql.org/docs/current/pgcrypto.html) (já instalada)

---

## 5.2 🚨 RLS aberto em todas as tabelas (`USING true` em todos os comandos)

**Severidade:** Crítica
**Categoria:** **OWASP A01:2021 — Broken Access Control**.

### O QUE
Todas as 4 tabelas de `public` têm policies `"Permitir leitura/edição/inserção/deleção para todos"` com `USING (true)` / `WITH CHECK (true)`. Isso anula completamente o RLS.

### ONDE
Confirmado em Bloco 2.2 — `pg_policies`:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `usuarios` | ✅ aberto | ✅ aberto | ✅ aberto | ❌ sem policy (bloqueado) |
| `solicitacoes` | ✅ aberto | ✅ aberto | ✅ aberto | ✅ aberto |
| `notificacoes` | ✅ aberto | ✅ aberto | ✅ aberto | ❌ sem policy |
| `user_settings` | ✅ aberto | ✅ aberto | ✅ aberto | ✅ aberto |

Existe policy adicional **inerte** em `usuarios`: `"Admin pode ver todos os usuários" USING (auth.uid() = id)`. Como o sistema **não usa Supabase Auth nativo** (login custom em [`AuthContext.tsx:32`](src/contexts/AuthContext.tsx#L32)), `auth.uid()` é sempre `NULL` — a policy nunca permite nada. **Mas como convive com a aberta, o resultado final é o da aberta** (Postgres faz `OR` entre policies).

### COMO se explora
```js
// Promover-se a admin
await window.supabase.from('usuarios')
  .update({ role: 'admin' })
  .eq('email', 'meu_email@empresa.com');

// Trocar senha de qualquer um
await window.supabase.from('usuarios')
  .update({ senha: 'novaSenha123' })
  .eq('email', 'ceo@empresa.com');

// Apagar TODOS os chamados
await window.supabase.from('solicitacoes').delete().neq('id', '');
```

### POR QUE é problema
- Promove privilege escalation trivial.
- Permite manipulação de dados de outros usuários sem autenticação.
- Permite deleção em massa.
- Anula a defesa front-end de [`RequestDetailPage.tsx:196-204`](src/pages/Requests/RequestDetailPage.tsx#L196) (`if (user?.role !== 'admin' && fetchedRequest.requesteremail !== user?.email)` — defesa de UI que pode ser contornada via DevTools).

### Referência
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) (sobre o comportamento `OR` entre múltiplas policies)

---

## 5.3 🚨 Storage policies abertas — leitura, escrita e deleção anônimas

**Severidade:** Crítica
**Categoria:** OWASP A01:2021 + A06:2021 (Vulnerable and Outdated Components — neste caso, decisão de configuração).

### O QUE
Em `storage.objects` existem 3 policies "amigáveis" + 3 policies abertas. As abertas vencem.

### ONDE
Confirmado em Bloco 4 (storage policies):

```
Permitir leitura dos arquivos      SELECT  USING (true)
Permitir upload para todos         INSERT  WITH CHECK (true)
Permitir deleção para todos        DELETE  USING (true)
```

(Existem também policies "Allow owner and admin read/delete" e "Allow authenticated upload" — todas dependem de `auth.uid()`/`auth.role()` que **não funcionam** com login custom.)

### COMO se explora
```js
// Listar e baixar todos os anexos privados
const { data: files } = await window.supabase
  .storage.from('anexos-solicitacoes').list('', { limit: 1000 });

// Deletar TUDO
for (const f of files) {
  await window.supabase.storage.from('anexos-solicitacoes').remove([f.name]);
}

// Subir malware no bucket público com URL eterna
await window.supabase.storage.from('guideit')
  .upload('malware.exe', fileBlob, { upsert: true });
```

Adicionalmente, o bucket `anexos-solicitacoes` tem `file_size_limit: null` → não há cota por arquivo. Atacante pode estourar a quota free-tier do Supabase.

### POR QUE é problema
- Vazamento de documentos sensíveis dos chamados.
- Substituição silenciosa de anexos legítimos.
- Vetor de distribuição de conteúdo malicioso a partir de uma URL legítima sua.
- Risco de exaustão de quota e indisponibilidade.

### Referência
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

---

## 5.4 🚨 `window.supabase` global

**ONDE:** [`src/lib/supabase.ts:165`](src/lib/supabase.ts#L165)

```ts
window.supabase = supabase;
```

### POR QUE
- Qualquer extensão de navegador, script de terceiro injetado, ou XSS futuro acessa o cliente autenticado.
- Aumenta a superfície de exploração das vulnerabilidades 5.1, 5.2, 5.3.
- Não há justificativa documentada (provavelmente debug que foi commitado).

**Correção atômica:** remover essa linha. 1 linha alterada.

---

## 5.5 🚨 URL do projeto Supabase exposta literalmente

**ONDE:**
- [`src/components/layout/Navbar.tsx:30`](src/components/layout/Navbar.tsx#L30) — `https://bwzqbxyqnxygoukhrtxh.supabase.co/...`
- [`src/pages/Requests/AcceptancePage.tsx:342`](src/pages/Requests/AcceptancePage.tsx#L342) — idem

### POR QUE
- O **project ref** (`bwzqbxyqnxygoukhrtxh`) é metadata sensível: combinado com a `anon key`, vira o endereço completo de ataque.
- Hoje o ref já está derivável do `VITE_SUPABASE_URL`, mas ter literais no código facilita reconhecimento e remoção do `.env`/CSP não tem como filtrar.

**Correção atômica:** mover para `import.meta.env.VITE_SUPABASE_URL + '/storage/v1/...'`.

---

## 5.6 🚨 Login custom permite enumeração de usuários

**ONDE:** [`src/contexts/AuthContext.tsx:32-39`](src/contexts/AuthContext.tsx#L32)

```ts
if (error || !data) throw new Error('Usuário não encontrado');
if (data.senha !== senha) throw new Error('Senha incorreta');
```

### POR QUE
Mensagens distintas permitem **enumeração de emails válidos** — atacante diferencia "email não existe" de "senha errada". Padrão clássico de A07:2021 — Identification and Authentication Failures.

### Referência
- [OWASP — Authentication Cheat Sheet § Authentication Responses](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-and-error-messages)

---

# 6. 🔴 Bugs funcionais confirmados

## 6.1 `<Toaster />` nunca é renderizado — ✅ RESOLVIDO (28/04/2026, Lote 1)
> `<Toaster />` (shadcn) renderizado em `App.tsx` dentro do `TooltipProvider`. Toasts voltaram a aparecer em todas as ações.

**Severidade:** 🔴 Alta — afeta feedback de quase todas as ações.

**ONDE:** [`src/App.tsx:58-95`](src/App.tsx#L58) — a árvore renderiza `QueryClientProvider → TooltipProvider → AuthProvider → ThemeProvider → NotificationProvider → BrowserRouter → Routes`. **Não há `<Toaster />` em parte alguma do código** (verificado por `grep '<Toaster'`).

### POR QUE
O hook `useToast` ([`src/hooks/use-toast.ts`](src/hooks/use-toast.ts)) gerencia uma fila em memória. Sem `<Toaster>` consumindo essa fila, **todos** os `toast({ title, description })` espalhados em ~30 pontos do sistema (criação de chamado, erro, exclusão, etc.) **não aparecem na tela**.

### Comprovação
- `grep '<Toaster'` em todo `src/` retorna apenas referências em arquivos de definição (`hooks/use-toast.ts:41`, `:140`), nunca em uso de JSX.
- `App.tsx` não importa nem renderiza `Toaster` nem `<Sonner Toaster />`.

### Referência
- [shadcn/ui — Toast install instructions](https://ui.shadcn.com/docs/components/toast) — passo "Add the Toaster component to your app" obrigatório.

---

## 6.2 SLA fantasma de 48h para tipos desconhecidos (front) — ✅ RESOLVIDO (29/04/2026)
> Substituído por tabela `SLA_HOURS_BY_TYPE` declarativa em `src/services/requestService.ts`. Tipos desconhecidos agora fazem `calculateDeadline` lançar erro — sem fallback silencioso. SLAs canônicos atualizados: Manutenção Preventiva 960h (40 dias), Ajuste de Estoque 72h (3 dias), demais inalterados.



**ONDE:** [`src/services/requestService.ts:19`](src/services/requestService.ts#L19) — `let hours = 48;`

### POR QUE
A função `calculateDeadline` define 48h como prazo padrão se o `type` não casar com nenhum case mapeado. **Esse SLA de 48h não existe no contrato oficial** ([`README.md § 6.1`](README.md), [`CLAUDE.md § 2.4`](CLAUDE.md)). É invenção da função.

### Onde se manifesta
Qualquer chamado criado com `type` fora dos canônicos cai aqui. Como não há `CHECK constraint` no banco, é tecnicamente possível.

---

## 6.3 SLA inconsistente em manutenção preventiva: dados reais mostram 960h

**Severidade:** 🔴 Alta — bug operacional comprovado.

### O QUE
Os 51 chamados de `preventive_maintenance` no banco têm `media_horas_sla = 960` (40 dias).

### Onde está cada fonte
- [`README.md § 6.1`](README.md) declara: **120h**.
- [`src/services/requestService.ts:31`](src/services/requestService.ts#L31): `if ... 'preventive_maintenance' || 'manutencao_preventiva'` → `hours = 120` ✅.
- Função SQL `criar_manutencao_preventiva_em_lote` (Bloco 3.5): `dias int := 10` → 240h ❌.
- Função SQL `criar_solicitacao_customizada` (Bloco 3.5): `'manutencao_preventiva' → 10 dias` → 240h ❌.
- **Banco real:** 960h ⚠️ (não bate com nenhuma das fontes).

### Hipótese
Alguém rodou um `UPDATE` em massa nos `deadlineat` desses 51 chamados, ou existiu uma versão da função SQL com `interval '40 days'` que foi alterada depois.

### Referência
- [`CLAUDE.md § 2.4 SLAs Oficiais (Verdade Canônica)`](CLAUDE.md#L46)

---

## 6.4 Hardcode "Nivaldo" por nome literal — ✅ RESOLVIDO (28/04/2026, Lotes 9 e 15)
> `requestService.createRequest` agora consulta `getAdminForRequestType(type)` em `src/config/adminAssignments.ts` e usa `findAdminByName()` do novo `userService`.

**ONDE:** [`src/services/requestService.ts:138-139`](src/services/requestService.ts#L138)

```ts
.eq('name', 'Nivaldo')
.eq('role', 'admin')
```

### POR QUE
- Quebra silenciosamente se Nivaldo sair da empresa, mudar o nome cadastrado para "Nivaldo Silva", ou se outro Nivaldo for cadastrado.
- Existe arquivo [`src/config/adminAssignments.ts`](src/config/adminAssignments.ts) **com a função correta** (`getAdminForRequestType`) **mas o service não a usa**.

---

## 6.5 Hardcode UUID "sistema_eugenio" em 2 lugares — ✅ RESOLVIDO (28/04/2026, Lote 9)
> UUID extraído para `src/config/specialUsers.ts` como `SISTEMA_EUGENIO_USER_ID`. Os 2 callers (`use-requests-data.ts` e `AllRequestsPage.tsx`) agora usam `isAssignedToSistemaEugenio()`.

**ONDE:**
- [`src/hooks/use-requests-data.ts:96`](src/hooks/use-requests-data.ts#L96): `if (r.assignedto === '5eb6f9f4-e0f0-4e4a-b7a6-32b2f3d23f45' && ...)`
- [`src/pages/Requests/AllRequestsPage.tsx:76`](src/pages/Requests/AllRequestsPage.tsx#L76): mesmo UUID literal

### POR QUE
- UUID literal duplicado em 2 lugares (DRY violado).
- Frágil: se Eugênio sair, o filtro "Sistema Eugênio" deixa de funcionar e ninguém percebe imediatamente.

---

## 6.6 Teste importa função inexistente

**ONDE:** [`src/services/__tests__/requestService.test.ts:4`](src/services/__tests__/requestService.test.ts#L4)

```ts
import { createRequest, getNivaldoAdmin } from '../requestService';
```

`getNivaldoAdmin` não existe em `requestService.ts`. **`npm test` falharia se rodasse**.

---

## 6.7 `uploadFile` chamado com path no slot de id — ✅ RESOLVIDO (28/04/2026, Lote 3)
> Linha 722 corrigida para `uploadFile(file, id)`. Anexos de rejeição agora vão para `solicitacao_<id>/` igual aos demais.

**ONDE:** [`src/pages/Requests/RequestDetailPage.tsx:722`](src/pages/Requests/RequestDetailPage.tsx#L722)

```ts
const uploadedFile = await uploadFile(file, `anexos-solicitacoes/${id}/rejeicao/`);
```

A assinatura em [`src/services/requestService.ts:227`](src/services/requestService.ts#L227) é:
```ts
export const uploadFile = async (file: File, requestId?: string): Promise<string>
```

O segundo parâmetro é **`requestId`**. O código passa um path. Resultado: o service compõe `solicitacao_anexos-solicitacoes/${id}/rejeicao/${uuid}_${name}` — pasta com nome bizarro no Storage.

---

## 6.8 `SettingsPage` salva e lê em colunas diferentes — ✅ RESOLVIDO (28/04/2026, Lote 3)
> Coluna `browser_notifications` (inexistente) substituída por `notifications_enabled` no upsert.

**ONDE:** [`src/pages/Settings/SettingsPage.tsx`](src/pages/Settings/SettingsPage.tsx)

- Linhas 65, 73 → leem `notifications_enabled` (coluna real do schema).
- Linha 95 → escrevem `browser_notifications` (coluna **inexistente** no schema).

**Comprovação empírica:** a tabela `user_settings` tem **1 linha** apenas (Bloco 1.2). O save sempre falha → ninguém configurou nada com sucesso.

---

## 6.9 `ThemeContext` ignora `localStorage.theme` — ✅ RESOLVIDO (28/04/2026, Lote 4)
> Lazy initializer agora lê `localStorage.theme` (com try/catch para modo privado restritivo) e usa `'dark'` apenas como fallback.

**ONDE:** [`src/contexts/ThemeContext.tsx:13-16`](src/contexts/ThemeContext.tsx#L13)

```ts
const [theme, setTheme] = useState<Theme>(() => {
  // Sempre iniciar com o tema escuro
  return 'dark';
});
```

### POR QUE
[`src/services/infrastructureService.ts:53,62`](src/services/infrastructureService.ts#L53) preserva `localStorage.theme` durante o "Session Shielding" — esforço inútil porque o `ThemeContext` ignora.

---

## 6.10 `use-robust-query` `meta.onError` nunca dispara — ✅ RESOLVIDO (29/04/2026)
> Hook simplificado: removido o `meta.onError` morto (TanStack Query v5 não invoca mais). Mantidos `retry: 2` e `retryDelay`. Feedback de erro agora é responsabilidade explícita de cada caller. Ver `src/hooks/use-robust-query.ts`.



**ONDE:** [`src/hooks/use-robust-query.ts:19-30`](src/hooks/use-robust-query.ts#L19)

### POR QUE
Em **TanStack Query v5**, callbacks `onError`/`onSuccess` dentro de `meta` **não são automaticamente invocados**. A v4 chamava; a v5 removeu (breaking change). [Documentação oficial](https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5#callbacks-on-usequery-and-queryobserver-have-been-removed).

**Resultado:** o toast `'Erro de Sincronização'` que parece ser plano B nunca é mostrado.

### Referência
- [TanStack Query v5 — Callbacks removidos](https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5#callbacks-on-usequery-and-queryobserver-have-been-removed)

---

## 6.11 `notifyAdmins` ignora erros do INSERT — ✅ RESOLVIDO (28/04/2026, Lote 8)
> INSERT em massa agora captura `insertError` e loga via `console.error` em modo dev. `notificacoes` migrou para `listAdminIds` do `userService` (Lote 15).

**ONDE:** [`src/services/notificationService.ts:65-86`](src/services/notificationService.ts#L65)

```ts
const notifications = admins.map(...);
await supabase.from('notificacoes').insert(notifications);
// ↑ não verifica error
```

Compare com `send()` na linha 22 que **verifica** o `error`. Inconsistência. Se o INSERT falhar (RLS, coluna nova, rede), nenhum admin é notificado e ninguém fica sabendo — nem em modo dev.

---

## 6.12 `try/catch (e) {}` engole erro de Storage — ✅ RESOLVIDO (28/04/2026, Lote 4)
> Catch vazio substituído por `console.warn` encapsulado em `if (!import.meta.env.PROD)`. A operação de delete da pasta foi posteriormente migrada para `storageService.deleteAttachmentFolder` (Lote 16).

**ONDE:** [`src/services/requestService.ts:218-220`](src/services/requestService.ts#L218)

```ts
try {
  await supabase.storage.from('anexos-solicitacoes').remove([`solicitacao_${id}`]);
} catch (e) {}
```

Falha silenciosa: anexos podem ficar **órfãos** no Storage e o sistema continua dizendo "exclusão concluída". Viola **CLAUDE.md Diretiva 6 #3** (Silent Logging).

---

## 6.13 `JSON.parse` sem try/catch no AuthContext — ✅ RESOLVIDO (28/04/2026, Lote 4)
> Bloco try/catch envolve o parse + setUser; em caso de corrupção, limpa `localStorage.usuarioLogado` e segue como deslogado. Login custom intacto.

**ONDE:** [`src/contexts/AuthContext.tsx:20-25`](src/contexts/AuthContext.tsx#L20)

```ts
const saved = localStorage.getItem('usuarioLogado');
if (saved) {
  const user = JSON.parse(saved);  // ← lança se JSON corrompido
  user.email = user.email?.toLowerCase();
  setUser(user);
}
```

Se o `localStorage.usuarioLogado` for corrompido (extensão de browser, falha de I/O, alteração manual), o app trava na inicialização sem mensagem útil.

---

## 6.14 Dashboard `chartData` ignora 3 tipos de chamado — ✅ RESOLVIDO indiretamente (28/04/2026, Lote 6)
> O gráfico nunca era renderizado. As variáveis `chartData`, `statusData` e o import `BarChart` foram removidos como código morto. O bug deixou de existir junto com o código.

**ONDE:** [`src/pages/Dashboard/DashboardPage.tsx:45-50`](src/pages/Dashboard/DashboardPage.tsx#L45)

Lista apenas: `ajuste_estoque`, `systems`, `general`, `other`. **Não considera** `equipment_request` (6 chamados), `employee_lifecycle` (0 mas existe no tipo), `preventive_maintenance` (51).

**Comprovação empírica do impacto:** o Dashboard hoje sub-representa **57+ chamados** (16% do total). O gráfico mente para o admin.

---

## 6.15 `getRequestById` mente sobre o tipo de retorno — ✅ RESOLVIDO (28/04/2026, Lote 8)
> Tipo de retorno corrigido para `Promise<ITRequest>` (sem `| undefined`). Função sempre retorna `ITRequest` ou lança erro.

**ONDE:** [`src/services/requestService.ts:118-122`](src/services/requestService.ts#L118)

```ts
export const getRequestById = async (id: string): Promise<ITRequest | undefined> => {
  const { data, error } = await supabase.from('solicitacoes').select('*').eq('id', id).single();
  if (error) throw new Error('Solicitação não encontrada');
  return data;
};
```

`.single()` lança se não houver linha. Então a função **nunca retorna `undefined`** — ou retorna `ITRequest`, ou lança. Tipagem mentirosa que induz componentes a `if (!request)` defensivo morto.

---

## 6.16 Race condition na geração de `solicitacoes.id`

**ONDE:** Função SQL `gerar_id_solicitacao` (Bloco 3.3).

```sql
SELECT max(right(id, 5))::int + 1 INTO sequencial ...
novo_id := prefix || lpad(sequencial::text, 5, '0');
```

Sem `LOCK`, sem `ON CONFLICT`. Dois INSERTs simultâneos no mesmo dia → ambos calculam o mesmo `sequencial` → segundo INSERT falha por violação de PK.

**Mitigado** (não corrompe dados — falha aberta), mas degrada UX em pico. **Amplificado** quando `criar_manutencao_preventiva_em_lote` cria 26 chamados em loop no mesmo segundo.

### Referência
- [PostgreSQL — Concurrency Control § Serialization Anomalies](https://www.postgresql.org/docs/current/transaction-iso.html)

---

## 6.17 `criar_manutencao_preventiva_em_lote` sem idempotência + SLA errado + PT-BR

**ONDE:** Função SQL no banco (Bloco 3.5).

### Bugs encadeados
1. Itera sobre **todos os usuários** (inclui admins — não filtra).
2. `dias int := 10` → grava SLA de 240h, contradizendo o canônico de 120h ([`README.md § 6.1`](README.md)).
3. Grava `priority='media'`, `status='nova'` em **PT-BR** — fora do canônico EN-US.
4. Sem proteção contra reentrada: chamada 2× → 52 chamados duplicados.
5. Reescreve a lógica de id em vez de chamar `gerar_id_solicitacao()` (DRY violado, com pequena variação `substring(s.id, 7, 5)` vs `right(id, 5)`).

---

## 6.18 `criar_solicitacao_customizada` com SLAs e tipos divergentes

**ONDE:** Função SQL (Bloco 3.5).

```sql
dias := case
  when p_type = 'geral' then 5
  when p_type = 'sistemas' then 10
  when p_type = 'ajuste_estoque' then 5  -- ← canônico = 1 dia (24h)
  when p_type = 'manutencao_preventiva' then 10  -- ← canônico = 5 dias
  else 3  -- ← SLA fantasma de 3 dias
end;
```

Compara em **PT-BR** (`'geral'`, `'sistemas'`) — se chamada com canônico EN-US, cai no `else 3`. Não é chamada pelo front (auditado por grep).

---

## 6.19 `admin_list_users` `SECURITY DEFINER` inerte mas perigosa

**ONDE:** Função SQL (Bloco 3.5).

```sql
if exists (select 1 from usuarios where id = auth.uid() and role = 'admin')
```

`auth.uid()` é sempre `NULL` (login custom) → função sempre retorna 0 linhas. **Hoje inerte.** Mas se algum dia migrar para Supabase Auth nativo, vira **bypass de RLS retornando senha incluída** (`RETURNS SETOF usuarios`).

Adicional: **sem `SET search_path = public`** — anti-padrão de `SECURITY DEFINER` documentado em [PostgreSQL docs](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY) (vetor de injection se atacante criar funções no path).

---

## 6.20 Permissão decidida no front em rota crítica

**ONDE:** [`src/pages/Requests/RequestDetailPage.tsx:196-204`](src/pages/Requests/RequestDetailPage.tsx#L196)

```ts
if (user?.role !== 'admin' && fetchedRequest.requesteremail !== user?.email) {
  toast({ title: 'Acesso Negado', ... });
  navigate('/dashboard');
  return;
}
```

Defesa de **UI**, contornável via DevTools. Como o RLS em `solicitacoes` está aberto (Seção 5.2), **a barreira real não existe**. Quando o RLS for fechado, esse `if` precisa virar comentário "// UX, defesa real está no RLS".

---

## 6.21 Criação automática de estoque atribui mesmo se Nivaldo não existir

**ONDE:** [`src/services/requestService.ts:134-150`](src/services/requestService.ts#L134)

Se `nivaldoUser` é `null`, o INSERT segue com `assignedto = null`. **Bug silencioso:** chamado de estoque "novo" deveria ser detectável; agora cai em `status='new'` sem atribuição e os admins são notificados via `notifyAdmins` (mas Nivaldo, especificamente, **não é avisado em separado**).

---

## 6.22 Polling de notificações sem janela de tempo — ✅ RESOLVIDO (28/04/2026, Lote 10)
> Adicionada constante `NOTIFICATION_WINDOW_DAYS = 15` no `NotificationContext`; query usa `.gte('criada_em', windowStart)`. Notificações com mais de 15 dias não são mais retornadas pelo polling.

**ONDE:** [`src/contexts/NotificationContext.tsx:35-40, 54`](src/contexts/NotificationContext.tsx#L35)

A query traz **TODAS** as notificações do usuário, sem filtro `lida = false` ou `criada_em >= now() - interval '30 days'`. Polling a cada 2 minutos × 26 usuários × ~65 notificações por usuário (média 1.702/26).

**Não é bug funcional** mas é desperdício previsível. Vai escalar mal.

---

## 6.23 Tipo de chamado detectado por substring de `title`

**ONDE:** [`src/pages/Requests/AcceptancePage.tsx:57-60`](src/pages/Requests/AcceptancePage.tsx#L57)

```ts
const titleLower = request?.title?.toLowerCase() || '';
const isTraining = titleLower.includes('treinamento');
const isOffboarding = titleLower.includes('offboarding');
const isOnboarding = !isTraining && !isOffboarding;
```

Frágil: se um admin renomear o título para `"Onboarding Treinamento de Maria"`, a página confunde os tipos. Deveria usar `request.metadata.form_data.action` ou `request.type`.

---

## 6.24 Permite criar mesmo email duas vezes na UI

**ONDE:** [`src/pages/Users/UsersPage.tsx:166-167`](src/pages/Users/UsersPage.tsx#L166)

O INSERT depende do `UNIQUE` em `usuarios.email` (que **existe** — Bloco 3.6) para barrar duplicidade. **Funciona**, mas a mensagem de erro só aparece quando o tratamento na linha 179 detecta `code 23505`. Se o erro for outro (rede), o tratamento mostra "Erro ao criar usuário" genérico.

🟢 Higiene — não é bug, é UX a melhorar.

---

## 6.25 Função `validateFormBeforeWhatsApp` declarada e nunca usada — ✅ RESOLVIDO (28/04/2026, Lote 8)
> Função (12 linhas) removida do `StockAdjustmentPage`. Confirmado por grep que não havia callers.

**ONDE:** [`src/pages/StockAdjustment/StockAdjustmentPage.tsx:296-307`](src/pages/StockAdjustment/StockAdjustmentPage.tsx#L296)

Função morta no meio do arquivo. 12 linhas de código sem propósito.

---

## 6.26 Fake progress bar engana o usuário

**ONDE:** [`src/components/requests/RequestForm.tsx:60-67`](src/components/requests/RequestForm.tsx#L60)

```ts
const progressInterval = setInterval(() => {
  setUploadProgress(prev => {
    const currentProgress = prev[file.name] || 0;
    if (currentProgress < 90) {
      return { ...prev, [file.name]: currentProgress + 10 };
    }
    ...
```

O upload do Supabase Storage **não emite progresso** (a SDK não tem onUploadProgress nativo na versão atual). O progresso aqui é simulado por `setInterval`. Se o upload demorar mais que ~3s para chegar a 90%, **o usuário vê 90% travado por minutos**. Se falhar, vê 100% antes do erro.

Viola **CLAUDE.md Diretiva 5** (Comunicação Honesta — não enganar usuário).

---

## 6.27 `criada_em` gerado no front em vez do servidor — ✅ RESOLVIDO (28/04/2026, Lote 9)
> Campo removido dos 2 INSERTs em `notificationService` (`send` e `notifyAdmins`). Coluna usa `DEFAULT now()` do banco.

**ONDE:** [`src/services/notificationService.ts:29, 80`](src/services/notificationService.ts#L29)

A coluna `notificacoes.criada_em` tem `DEFAULT now()` (Bloco 2.1) — o servidor preenche se omitido. Hoje o front gera `new Date().toISOString()` e envia. Refém do relógio do cliente; quebra auditoria se relógio estiver errado.

**Correção atômica:** remover o campo do payload — o banco preenche.

---

## 6.28 `solicitacoes.createdat` SEM `DEFAULT now()` no banco

**ONDE:** Schema da tabela (Bloco 2.1).

Diferentemente de `notificacoes.criada_em`, a coluna `solicitacoes.createdat` **não tem default**. O front gera no [`src/services/requestService.ts:126`](src/services/requestService.ts#L126). Refém do relógio do cliente, mesmo problema. **Pior**: nem dá para "só remover do payload" — precisa adicionar default no schema primeiro.

---

# 7. 🟠 Violações do protocolo interno

> Tudo nesta seção é violação direta de [`CLAUDE.md`](CLAUDE.md), [`CONTRIBUTING.md`](CONTRIBUTING.md) ou [`README.md`](README.md) confirmada por arquivo:linha.

## 7.1 Violação Diretiva 6 #5 — Importação direta de `lucide-react`

`CLAUDE.md` proíbe explicitamente:
> ❌ Importará diretamente de `lucide-react` em vez de usar `getSemanticIcon`.

**Onde ocorre (mapa de pontos):**
- [`src/pages/Requests/RequestDetailPage.tsx:5`](src/pages/Requests/RequestDetailPage.tsx#L5) — 15 ícones diretos
- [`src/pages/Requests/AcceptancePage.tsx:9`](src/pages/Requests/AcceptancePage.tsx#L9) — 5 ícones
- [`src/pages/Requests/AllRequestsPage.tsx:3`](src/pages/Requests/AllRequestsPage.tsx#L3)
- [`src/pages/Requests/MyRequestsPage.tsx:3`](src/pages/Requests/MyRequestsPage.tsx#L3)
- [`src/pages/Requests/NewRequestPage.tsx:4`](src/pages/Requests/NewRequestPage.tsx#L4)
- [`src/pages/Dashboard/DashboardPage.tsx:3`](src/pages/Dashboard/DashboardPage.tsx#L3)
- [`src/pages/Reports/ReportsPage.tsx:4`](src/pages/Reports/ReportsPage.tsx#L4)
- [`src/pages/Users/UsersPage.tsx:6`](src/pages/Users/UsersPage.tsx#L6)
- [`src/pages/StockAdjustment/StockAdjustmentPage.tsx:4`](src/pages/StockAdjustment/StockAdjustmentPage.tsx#L4)
- [`src/pages/NotFound.tsx:5`](src/pages/NotFound.tsx#L5)
- [`src/components/layout/Navbar.tsx:3`](src/components/layout/Navbar.tsx#L3)
- [`src/components/layout/Sidebar.tsx:4`](src/components/layout/Sidebar.tsx#L4)
- [`src/components/auth/LoginForm.tsx`](src/components/auth/LoginForm.tsx) — usa indiretamente via Aceternity
- [`src/components/requests/RequestCard.tsx:3`](src/components/requests/RequestCard.tsx#L3)
- [`src/components/requests/RequestForm.tsx:6`](src/components/requests/RequestForm.tsx#L6)
- [`src/components/requests/LifecycleRequestForm.tsx:3`](src/components/requests/LifecycleRequestForm.tsx#L3)
- [`src/components/notifications/NotificationsList.tsx:4`](src/components/notifications/NotificationsList.tsx#L4)
- [`src/components/reports/ReportFilters.tsx:3`](src/components/reports/ReportFilters.tsx#L3)
- [`src/components/ai/ChatAssistant.tsx:2`](src/components/ai/ChatAssistant.tsx#L2)
- [`src/components/ui/signature-canvas.tsx:3`](src/components/ui/signature-canvas.tsx#L3) (ok aqui — é componente UI primitivo, mas idealmente também usaria `getSemanticIcon` se for usado em página)

**Total:** ~21 arquivos importam direto de `lucide-react`.

**Pré-requisito:** o `iconMapping` em [`src/lib/utils.ts:114-137`](src/lib/utils.ts#L114) hoje tem **15 ícones** semânticos. Os 15 ícones diretos do `RequestDetailPage` cobrem outros: `ArrowLeft`, `Calendar`, `Send`, `User`, `ThumbsUp`, `ThumbsDown`, `Trash2`, `X`, `Link`, `Info`, `PaperclipIcon`, etc. — **a maioria não está no mapping**. Antes de "consertar", precisa expandir o `iconMapping`.

---

## 7.2 Violação Diretiva 6 #7 — Cores hex inline e tokens não-semânticos

**Hex inline (proibido literalmente):**
- [`src/components/layout/Sidebar.tsx:84`](src/components/layout/Sidebar.tsx#L84): `dark:hover:from-[#23272f] dark:hover:to-[#2d3748]`
- [`src/pages/Requests/MyRequestsPage.tsx:138`](src/pages/Requests/MyRequestsPage.tsx#L138): mesma string
- [`src/pages/StockAdjustment/StockAdjustmentPage.tsx:370`](src/pages/StockAdjustment/StockAdjustmentPage.tsx#L370): mesma string
- [`src/components/requests/LifecycleRequestForm.tsx:308`](src/components/requests/LifecycleRequestForm.tsx#L308): mesma string
- [`src/pages/Users/UsersPage.tsx:498`](src/pages/Users/UsersPage.tsx#L498): `style={{ color: 'red' }}` (cor literal)
- [`tailwind.config.ts:67-74`](tailwind.config.ts#L67) define `success: { DEFAULT: '#10b981' }` e `warning: { DEFAULT: '#f59e0b' }` em hex — viola o espírito da regra (são tokens, mas são hex literais no config).
- [`tailwind.config.ts:76-84`](tailwind.config.ts#L76) define `status.assigned: '#a855f7'` etc. — idem.

**Cores Tailwind cruas (não-tokens semânticos):**
- [`src/pages/Requests/RequestDetailPage.tsx:387`](src/pages/Requests/RequestDetailPage.tsx#L387): `'bg-slate-500'`
- [`src/pages/Requests/RequestDetailPage.tsx:434-436`](src/pages/Requests/RequestDetailPage.tsx#L434): `'text-red-500'`, `'text-amber-500'`, `'text-amber-400'`
- [`src/pages/Requests/RequestDetailPage.tsx:1301-1302`](src/pages/Requests/RequestDetailPage.tsx#L1301): `text-green-500/600`, `text-red-500/600`
- [`src/pages/Requests/RequestDetailPage.tsx:1402`](src/pages/Requests/RequestDetailPage.tsx#L1402): `bg-green-600 hover:bg-green-700 text-white`
- [`src/pages/Requests/AcceptancePage.tsx:463,466,517,583`](src/pages/Requests/AcceptancePage.tsx#L463): `border-t-green-500`, `text-green-500`, `bg-yellow-500/10`
- [`src/pages/Requests/AllRequestsPage.tsx:146-148,389`](src/pages/Requests/AllRequestsPage.tsx#L146): `bg-red-50/border-red-200/text-red-600/700`, `text-red-500`
- [`src/pages/Requests/MyRequestsPage.tsx:281`](src/pages/Requests/MyRequestsPage.tsx#L281): `text-red-500`
- [`src/pages/Reports/ReportsPage.tsx:175`](src/pages/Reports/ReportsPage.tsx#L175): `text-red-500`
- [`src/pages/Auth/ResetPasswordPage.tsx:12`](src/pages/Auth/ResetPasswordPage.tsx#L12): `bg-white`
- [`src/pages/Dashboard/DashboardPage.tsx:103,116`](src/pages/Dashboard/DashboardPage.tsx#L103): `text-amber-500`, `text-green-500`
- [`src/pages/StockAdjustment/StockAdjustmentPage.tsx`](src/pages/StockAdjustment/StockAdjustmentPage.tsx) linhas 378, 388, 398, 417, 440, 453, 482, 495, 526, 536: `text-red-500` × **10** (asterisco "obrigatório").
- [`src/components/requests/LifecycleRequestForm.tsx:330,338,346`](src/components/requests/LifecycleRequestForm.tsx#L330): `text-green-500`, `text-red-500`, `text-blue-500` em ícones inline.
- [`src/components/auth/LoginForm.tsx`](src/components/auth/LoginForm.tsx) linhas 61, 68, 76, 84: `bg-red-500/20`, `border-red-500/30`, `text-red-300`, dezenas de `bg-white/N`, `bg-black/N`, `border-white/N`.
- [`src/components/requests/RequestCard.tsx:76`](src/components/requests/RequestCard.tsx#L76): `text-white`.

---

## 7.3 Violação Diretiva 6 #8 — Chamadas Supabase diretas em componentes

[`CLAUDE.md § 2.3`](CLAUDE.md#L37) declara:
> A lógica de domínio reside **exclusivamente** em `src/services/`. Nenhuma regra de negócio pode migrar para componentes React.

**Onde ocorre:**
- [`src/pages/Requests/RequestDetailPage.tsx`](src/pages/Requests/RequestDetailPage.tsx) — **6 chamadas diretas:** linhas 246-248, 265-268, 307, 650-653, 767, 813.
- [`src/pages/Users/UsersPage.tsx`](src/pages/Users/UsersPage.tsx) — **6+ chamadas diretas:** 92-96, 100, 125-129, 133, 166, 202, 223, 263.
- [`src/pages/Settings/SettingsPage.tsx`](src/pages/Settings/SettingsPage.tsx) — linhas 41-45, 49-51, 58-62, 91-96.
- [`src/pages/Auth/ResetPasswordPage.tsx`](src/pages/Auth/ResetPasswordPage.tsx) — importa `supabase` (não usa, mas mostra padrão).
- [`src/contexts/AuthContext.tsx:32-36`](src/contexts/AuthContext.tsx#L32) — context faz query direta (poderia ser `authService`).
- [`src/contexts/NotificationContext.tsx:35-39`](src/contexts/NotificationContext.tsx#L35) — context faz query direta (deveria via `notificationService`).
- [`src/components/layout/Navbar.tsx:13`](src/components/layout/Navbar.tsx#L13) — importa `supabase` (não usa hoje, mas o import existe).

**Recorrência:** o padrão `await supabase.from('usuarios').select('id').eq('email', ?).single()` para "obter id por email" aparece em pelo menos **3 pontos do RequestDetailPage** — duplicação que deveria estar em `userService.getIdByEmail(email)` (service que ainda **não existe**).

---

## 7.4 Violação Diretiva 6 #1 — `any` explícito

[`CLAUDE.md § 6`](CLAUDE.md#L222) — Lista negra:
> ❌ Introduzirá `any` em código novo.

- [`src/pages/Requests/RequestDetailPage.tsx:206,374`](src/pages/Requests/RequestDetailPage.tsx#L206): `catch (error: any)`
- [`src/pages/Requests/AllRequestsPage.tsx:216,217,224,225,232,233,246,247,254,255,262,263`](src/pages/Requests/AllRequestsPage.tsx#L216): vários `as any` em filtros
- [`src/components/reports/ReportFilters.tsx:18`](src/components/reports/ReportFilters.tsx#L18): `onFilterChange: (filters: any) => void`
- [`src/utils/locale-config.ts:38,132`](src/utils/locale-config.ts#L38): `(window as any).ptBRFormatters`
- [`src/components/requests/RequestCard.tsx:58-59`](src/components/requests/RequestCard.tsx#L58): `(request as ITRequest & { productName?: string })` cast forçado
- [`src/components/requests/LifecycleRequestForm.tsx`](src/components/requests/LifecycleRequestForm.tsx) — `getOnboardingLabel(req: any)` e similares
- [`src/components/ui/typing-animation.tsx:74`](src/components/ui/typing-animation.tsx#L74): `motion(Component as any)`
- [`src/components/ui/chart.tsx:361`](src/components/ui/chart.tsx#L361): `data: any[]`
- [`src/components/ui/placeholders-and-vanish-input.tsx:53`](src/components/ui/placeholders-and-vanish-input.tsx#L53): `onSubmit && onSubmit(e as any)`

---

## 7.5 Violação Diretiva 6 #3 — Logging fora do guard

[`CLAUDE.md § 6`](CLAUDE.md#L222):
> ❌ Removerá `if (!import.meta.env.PROD)` de logs existentes.

(Hoje a violação é o **inverso** — há logs sem guard.)

- [`src/config/adminAssignments.ts:51`](src/config/adminAssignments.ts#L51): `console.error(...)` sem guard.

E **catches que não logam nada** — pior que silent logging:
- [`src/pages/Requests/RequestDetailPage.tsx:636,707,776,823,878`](src/pages/Requests/RequestDetailPage.tsx#L636) — 5 catches que só fazem `toast` sem `console.error`.

---

## 7.6 Violação Diretiva 4 — Cache local de dados de domínio

[`CLAUDE.md § 3 Diretiva 4`](CLAUDE.md#L94):
> Camadas de cache local (localStorage/IndexedDB/sessionStorage de dados de domínio) — viola Real-Time Consistency.

**Ocorrência:** [`src/contexts/AuthContext.tsx:51`](src/contexts/AuthContext.tsx#L51) — `localStorage.setItem('usuarioLogado', JSON.stringify(secureUser))`.

⚠️ INFERÊNCIA: pode ser tratado como exceção formal (auth precisa persistir entre F5). Mas **não está documentado** como exceção em CONTRIBUTING. Conflita também com a "Blindagem de Sessão" do `infrastructureService` que apaga essa chave em nova aba — comportamento intencional, mas a coexistência merece comentário no código.

---

## 7.7 Violação Diretiva 6 #6 — Cores/labels não centralizadas

`statusStyles` e `priorityStyles` existem em [`src/lib/utils.ts:153-179`](src/lib/utils.ts#L153). **Mas:**

- [`src/pages/Dashboard/DashboardPage.tsx`](src/pages/Dashboard/DashboardPage.tsx) usa cores cruas em vez de styles centralizados.
- [`src/pages/Requests/AcceptancePage.tsx`](src/pages/Requests/AcceptancePage.tsx) usa `text-green-500` em vez de `getStatusStyle('resolved').color`.
- [`src/pages/Requests/RequestDetailPage.tsx`](src/pages/Requests/RequestDetailPage.tsx) usa cores cruas para o semáforo de SLA (linhas 434-436) — não há `slaStyles` central.

---

## 7.8 Violação Diretiva 6 #4 — Tradução central

`translate()` existe em [`src/lib/utils.ts:104`](src/lib/utils.ts#L104). **Mas** [`src/components/notifications/NotificationsList.tsx:74-91`](src/components/notifications/NotificationsList.tsx#L74) implementa `traduzirTitulo()` próprio — paralelo ao `translate('notificationType', ...)` que **deveria existir** no dicionário central.

---

# 8. 🟡 Higiene e código morto

## 8.1 Componentes UI mortos (não usados em lugar algum)

Verificado por `grep`. ~480 linhas de código morto:

- [`src/components/ui/evervault-background.tsx`](src/components/ui/evervault-background.tsx) — 92 linhas, **0 usos**.
- [`src/components/ui/border-beam.tsx`](src/components/ui/border-beam.tsx) — 72 linhas, **0 usos**.
- [`src/components/ui/moving-border.tsx`](src/components/ui/moving-border.tsx) — 159 linhas (incluindo um `Button` interno que sobrescreve o nome `Button`), **0 usos**.
- [`src/components/ui/placeholders-and-vanish-input.tsx`](src/components/ui/placeholders-and-vanish-input.tsx) — 156 linhas, **0 usos**.
- Função `LoginForm` interna em [`src/components/ui/evervault-card.tsx:59-94`](src/components/ui/evervault-card.tsx#L59) — **dead code de fallback**.
- `BarChart` exportado de [`src/components/ui/chart.tsx:357-432`](src/components/ui/chart.tsx#L357) e importado em [`Dashboard:10`](src/pages/Dashboard/DashboardPage.tsx#L10) **mas nunca renderizado** no JSX.

## 8.2 Imports órfãos

- [`src/services/infrastructureService.ts:1`](src/services/infrastructureService.ts#L1): `supabase` importado, nunca usado.
- [`src/services/notificationService.ts:2`](src/services/notificationService.ts#L2): tipo `Notification` importado, nunca usado.
- [`src/services/preventiveMaintenanceService.ts:3`](src/services/preventiveMaintenanceService.ts#L3): `ITRequest` importado, nunca usado.
- [`src/services/preventiveMaintenanceService.ts:2`](src/services/preventiveMaintenanceService.ts#L2): comentário `// import { users } from './authService';` (authService **não existe**).
- [`src/components/auth/ForgotPasswordForm.tsx`](src/components/auth/ForgotPasswordForm.tsx) — todos os imports do header não são usados pela função (ela só renderiza um `<div>` com texto). Interface `ForgotPasswordFormProps` declarada e ignorada.
- [`src/components/ai/ChatAssistant.tsx:18`](src/components/ai/ChatAssistant.tsx#L18): `useTheme` importado, nunca usado.
- [`src/components/layout/Navbar.tsx:13`](src/components/layout/Navbar.tsx#L13): `supabase` importado, nunca usado.
- [`src/pages/Auth/ResetPasswordPage.tsx`](src/pages/Auth/ResetPasswordPage.tsx) — quase todos os imports do topo não são usados.

## 8.3 Comentários mortos / código comentado

- [`src/services/infrastructureService.ts:78`](src/services/infrastructureService.ts#L78): `// window.location.reload();`
- [`src/components/layout/Navbar.tsx:50`](src/components/layout/Navbar.tsx#L50): `<h1 className="...">Solicitação de TI</h1>` comentado.
- [`src/components/layout/AuthLayout.tsx:39-40`](src/components/layout/AuthLayout.tsx#L39): título e subtítulo comentados.

## 8.4 `App.css` é majoritariamente boilerplate Vite default

[`src/App.css`](src/App.css) — 95% do conteúdo são estilos do scaffolding inicial do Vite (`#root max-width: 1280px`, `.logo`, `logo-spin`, `.read-the-docs`, `.card`). **Nunca foram limpos** após criação do projeto. As regras `.logo*` referenciam um logo que não existe na aplicação.

## 8.5 Constraints/índices redundantes

- `user_settings` tem **dois índices em `id`**: `user_settings_pkey` (PK) + `user_settings_id_unique` (UNIQUE redundante).
- Tabela `solicitacoes` perdeu a coluna `pos 2` (sem nome — provável `DROP COLUMN`); `pg_attribute` mantém o "buraco". Inofensivo mas evidência de schema sem governança.

## 8.6 Funções SQL fantasma

- `criar_solicitacao_customizada()` — não chamada pelo código.
- `admin_list_users()` — inerte (depende de `auth.uid()`).

## 8.7 Coluna `enviado_whatsapp` em `notificacoes`

Existe no schema, **default `false`**, **nenhuma referência no código**. Roadmap abandonado.

## 8.8 Coluna `theme` em `user_settings`

Existe, **nenhum lugar lê ou escreve** (o tema é gerenciado em `localStorage` pelo `ThemeContext`). Coluna morta.

## 8.9 `pg_stat_user_tables` desatualizado

A tabela `usuarios` reportou `n_live_tup = 0`, mas `COUNT(*)` retornou 26. Estatística histórica desatualizada — sintoma comum em Postgres se não há `ANALYZE` recente. Inofensivo, mas vale `VACUUM ANALYZE usuarios` em algum momento.

## 8.10 Strings duplicadas (toasts)

Aproximadamente **14 ocorrências** de `'Falha ao... Por favor, tente novamente.'` em `RequestDetailPage`. Centralizar em `messages.ts` é trivial.

## 8.11 Texto em inglês em sistema PT-BR

[`src/pages/NotFound.tsx:15-17,20`](src/pages/NotFound.tsx#L15) — `"Oops! Page not found"`, `"The page you are looking for..."`, `"Back to Dashboard"`.

## 8.12 `"use client"` directives sem efeito

[`src/components/ui/evervault-card.tsx:1`](src/components/ui/evervault-card.tsx#L1), [`src/components/ui/evervault-background.tsx:1`](src/components/ui/evervault-background.tsx#L1), [`src/components/ui/typing-animation.tsx:1`](src/components/ui/typing-animation.tsx#L1), [`src/components/ui/border-beam.tsx:1`](src/components/ui/border-beam.tsx#L1), [`src/components/ui/moving-border.tsx:1`](src/components/ui/moving-border.tsx#L1), [`src/components/ui/placeholders-and-vanish-input.tsx:1`](src/components/ui/placeholders-and-vanish-input.tsx#L1).

`"use client"` é uma diretiva do Next.js. **No Vite, é apenas uma string sem efeito.** Resíduo de copy-paste do Aceternity UI sem revisão.

## 8.13 `<input>`/`<label>` HTML cru em vez de Radix shadcn

- [`src/pages/Requests/RequestDetailPage.tsx:1505,1509`](src/pages/Requests/RequestDetailPage.tsx#L1505): `<label>` HTML em vez de `<Label>` shadcn.
- [`src/components/auth/LoginForm.tsx:68,80`](src/components/auth/LoginForm.tsx#L68): `<input>` em vez de `<Input>`.
- [`src/components/ai/ChatAssistant.tsx:65`](src/components/ai/ChatAssistant.tsx#L65): `<input type="file">` cru.
- [`src/components/requests/ReportFilters.tsx:51,69,90,121`](src/components/reports/ReportFilters.tsx#L51): `<label>` HTML cru.
- [`src/pages/Users/UsersPage.tsx:441-510`](src/pages/Users/UsersPage.tsx#L441): `<table>`/`<thead>`/`<tbody>`/`<tr>` HTML em vez de `<Table>` shadcn.

## 8.14 `window.confirm` em vez de `<AlertDialog>`

- [`src/pages/Requests/RequestDetailPage.tsx:615`](src/pages/Requests/RequestDetailPage.tsx#L615) — exclusão de chamado.
- [`src/pages/Users/UsersPage.tsx:261`](src/pages/Users/UsersPage.tsx#L261) — exclusão de usuário.

Inconsistente com Radix Dialogs do resto do app.

## 8.15 `crypto.randomUUID()` sem fallback

Usado em vários pontos para gerar IDs de Comments/Attachments. Disponível em Chrome/Edge ≥92 e Safari ≥15.4. Para sistemas internos com navegadores modernos: OK. ⚠️ INFERÊNCIA: público alvo precisa ser confirmado.

## 8.16 Inconsistência entre dois sistemas de Toast instalados

`sonner` (^1.5.0) e `@radix-ui/react-toast` (^1.2.1) **ambos instalados**, ambos com wrappers em `src/components/ui/sonner.tsx` e `src/components/ui/toaster.tsx`. **Nenhum dos dois renderiza Toaster** no `App.tsx` (Bug 6.1). Manter uma única lib é higiene + redução de bundle.

## 8.17 `pg_stat_statements` instalada mas sem uso documentado

Útil para identificar queries lentas. Hoje, com 349 chamados, não é prioridade — mas vale mencionar.

---

# 9. 📐 Bugs de tipagem (mascarados)

> Todos esses bugs **passam silenciosamente hoje** porque `strict: false` (Seção 3.1). Quando o Strict for ligado, vão virar erros de compilação.

## 9.1 `RequestStatus` não inclui `'rejected'`

[`src/types/index.ts:15`](src/types/index.ts#L15):
```ts
export type RequestStatus = 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'reopened' | 'cancelled';
```

**Mas o código grava `'rejected'`:** [`src/pages/Requests/RequestDetailPage.tsx:754`](src/pages/Requests/RequestDetailPage.tsx#L754).

Empiricamente: `status='rejected'` não aparece nos 349 chamados (Bloco 2.7) — talvez ninguém ainda rejeitou em produção. Mas o caminho está pronto e tipado errado.

## 9.2 `RequestType` não inclui PT-BR

`RequestType` é só EN-US. Mas o código compara contra:
- `'sistemas'`, `'geral'`, `'manutencao_preventiva'`, `'ciclo_colaborador'`, `'solicitacao_equipamento'` — em [`src/services/requestService.ts:22-31`](src/services/requestService.ts#L22).

E o banco contém: `'sistemas'` (3 linhas), `'solicitacao_equipamento'` (2 linhas) — Bloco 2.6.

## 9.3 `RequestPriority` não inclui PT-BR

Similar: tipo só tem EN-US, código compara com PT-BR, banco contém PT-BR. 10 linhas em PT-BR (Bloco 2.8).

## 9.4 `User` não tem `senha` mas o banco sim

[`src/types/index.ts:3-11`](src/types/index.ts#L3) — `User` tem `id, email, name, role, department?, position?, whatsapp?`. **Não tem `senha`** — bom para não vazar nos componentes. **Mas** `select('*')` em [`src/contexts/AuthContext.tsx:34`](src/contexts/AuthContext.tsx#L34) traz a senha; o tipo mente sobre isso.

## 9.5 `Notification.tipo` é `string` aberto — ✅ RESOLVIDO (29/04/2026)
> Tipo `NotificationType` criado em `src/types/index.ts` como união fechada (9 EN-US + 3 PT-BR legados). `Notification.tipo` e `CreateNotificationParams.tipo` agora exigem esse tipo. Função helper `buildRequestNotificationType(status)` substituiu o template literal dinâmico em `requestService.ts:216`.



[`src/types/index.ts:93`](src/types/index.ts#L93). Deveria ser union literal: `'request_created' | 'request_assigned' | 'request_resolved' | 'comentario' | 'rejeicao' | 'prazo_estendido' | 'request_in_progress' | 'request_reopened'` (mapa em [`NotificationsList:74`](src/components/notifications/NotificationsList.tsx#L74)).

## 9.6 `RequestType.other` declarado, 0 ocorrências

`'other'` em [`src/types/index.ts:13`](src/types/index.ts#L13). **0 chamados** com esse tipo no banco. Pode sair.

## 9.7 `RequestStatus.closed/reopened/cancelled` declarados, 0 ocorrências

Idem. Caminhos teóricos sem uso real. ⚠️ INFERÊNCIA: pode ser intencional (fluxo previsto, não usado).

## 9.8 Tipo de retorno mentiroso em `getRequestById`

Já listado em 6.15.

## 9.9 `before_insert_solicitacao()` e `gerar_id_solicitacao()` geram `varchar(11)` — coluna é `varchar(13)`

Coluna superdimensionada por 2 chars. Não é bug funcional. ⚠️ INFERÊNCIA: provável vestígio de design inicial.

## 9.10 `id?.split('-')[0]` assume formato com hífen

[`src/pages/Requests/AcceptancePage.tsx:591`](src/pages/Requests/AcceptancePage.tsx#L591):
```ts
{id?.split('-')[0].toUpperCase()}-{new Date(request.resolvedat || '').getTime()}
```

Os ids gerados por `gerar_id_solicitacao` (formato `DDMMYYNNNNN`) **não têm hífen**. O `split('-')[0]` retorna o id inteiro. Visualmente "Código de Rastreabilidade" fica `28042600001-1714230000000` — funcional, mas semanticamente errado.

---

# 10. 🗄️ Achados específicos do banco

## 10.1 Tabela `feriados` referenciada mas inexistente

[`src/services/holidayService.ts:5,11`](src/services/holidayService.ts#L5) faz `supabase.from('feriados')`. **A tabela não existe** (Bloco 1.1). Toda chamada `getHolidays`/`addHoliday` lança erro. Hoje ninguém chama o service.

## 10.2 Zero foreign keys em todo o banco

Bloco 3.6 — nenhuma FK declarada em nenhuma tabela.

**Implicação:** soft-corruption silenciosa. Quando admin deleta usuário em `UsersPage.handleDeleteUser`:
- `solicitacoes.requesterid` aponta para usuário inexistente.
- `solicitacoes.assignedto` órfão.
- `notificacoes.para` órfão.
- `notificacoes.request_id` órfão se chamado for deletado depois.

## 10.3 Zero CHECK constraints de domínio

Bloco 3.6 — nenhuma constraint que limite `status`, `priority`, `type`, `role`, `approvalstatus` a valores válidos. Por isso valores PT-BR conviveram com EN-US sem reclamação do banco.

**Referência:** [PostgreSQL — CHECK constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS).

## 10.4 `varchar(13)` superdimensionado para id de 11 chars

Já citado em 9.9.

## 10.5 Sem índice em `notificacoes(para, criada_em)`

Bloco 3.7. Polling a cada 2 minutos faz scan completo da tabela 1.702 linhas para cada usuário. Otimização de baixo custo, alto impacto previsível.

## 10.6 Sem índices em filtros frequentes de `solicitacoes`

`requesteremail`, `assignedto`, `status`, `type`, `priority`, `approvalstatus` — nenhum índice. Hoje (349 linhas) é trivial. Quando crescer, importa.

## 10.7 Coluna `pos 2` removida em `solicitacoes`

Provável `DROP COLUMN` antigo. O Postgres mantém o "buraco". Inofensivo.

## 10.8 Mensagem de login distingue "usuário não encontrado" de "senha incorreta"

Já listado em 5.6.

## 10.9 `pg_cron` ausente — automação semestral não pode ser agendada

Bloco 1.4. Para a função `criar_manutencao_preventiva_em_lote` ser agendada, `pg_cron` precisa ser ativado em **Dashboard → Database → Extensions**.

**Referência:** [Supabase pg_cron Guide](https://supabase.com/docs/guides/database/extensions/pg_cron).

## 10.10 Buckets sem `file_size_limit` nem `allowed_mime_types`

Bloco 1.5. Vetor de spam/exaustão de quota.

---

# 11. 🧭 Ordem segura de execução

> **Princípio:** cada passo precisa ser executável **sem quebrar o anterior**. Edições atômicas (`CLAUDE.md Diretiva 2`).

## ⚡ FASE 0 — EMERGÊNCIA (segurança)

**Não pode esperar. Recomendo começar antes de qualquer outra fase.**

### Pré-requisitos antes de tocar policies
1. **Decidir sobre autenticação:** migrar para Supabase Auth nativo (recomendado), ou hashar senhas com `pgcrypto` mantendo login custom, ou aceitar formalmente como sistema interno fechado documentado.
2. **Confirmar que `/aceite/:id` precisa ficar público** — sim, é público (não requer login), portanto vai precisar de policy específica de SELECT por id em `solicitacoes` quando o RLS for fechado.

### Sequência mínima (cada item é uma intervenção atômica)

| # | O quê | Onde | Risco |
|---|---|---|---|
| 0.1 | Remover `window.supabase = supabase;` | [`src/lib/supabase.ts:165`](src/lib/supabase.ts#L165) | 🟢 Zero (verificável: nada externo deve depender disso) |
| 0.2 | Mover URL Supabase literal para `.env` | [Navbar:30](src/components/layout/Navbar.tsx#L30), [AcceptancePage:342](src/pages/Requests/AcceptancePage.tsx#L342) | 🟢 Zero |
| 0.3 | Adicionar `try/catch` em `JSON.parse('usuarioLogado')` | [AuthContext:22](src/contexts/AuthContext.tsx#L22) | 🟢 Zero |
| 0.4 | Hashar senhas existentes (`pgcrypto.crypt('...', gen_salt('bf'))`) e migrar `AuthContext` para comparar via função SQL `SECURITY DEFINER` | banco + AuthContext | 🟠 Médio — requer migração coordenada |
| 0.5 | Reescrever policies RLS em todas as 4 tabelas — fechar acessos abertos | banco | 🟠 Médio — `/aceite/:id` precisa policy específica |
| 0.6 | Reescrever policies de Storage para os 2 buckets | banco | 🟠 Médio |
| 0.7 | Adicionar `file_size_limit` e `allowed_mime_types` nos buckets | banco | 🟢 Zero |
| 0.8 | Padronizar mensagem de erro de login (uma única "Credenciais inválidas") | [AuthContext:37,39](src/contexts/AuthContext.tsx#L37) | 🟢 Zero |

**Após 0.4 e 0.5:** o sistema **inteiro precisa ser testado**. Vão quebrar:
- A rota `/aceite/:id` se a policy específica não estiver criada.
- Operações que dependiam do RLS aberto sem perceber.

## 🔴 FASE 1 — Bugs funcionais isolados (cada um atômico)

| # | O quê | Onde |
|---|---|---|
| 1.1 | Renderizar `<Toaster />` (decidir entre sonner ou radix) | [App.tsx](src/App.tsx) |
| 1.2 | Corrigir `uploadFile(file, 'anexos-solicitacoes/...')` para `uploadFile(file, id)` | [RequestDetailPage:722](src/pages/Requests/RequestDetailPage.tsx#L722) |
| 1.3 | Corrigir mismatch de colunas em SettingsPage (decidir nome canônico: `notifications_enabled` | [SettingsPage:95](src/pages/Settings/SettingsPage.tsx#L95) |
| 1.4 | `ThemeContext` ler `localStorage.theme` no init | [ThemeContext:13](src/contexts/ThemeContext.tsx#L13) |
| 1.5 | Substituir `meta.onError` por padrão v5 (`useQuery({ throwOnError })` ou hook próprio) | [use-robust-query.ts](src/hooks/use-robust-query.ts) |
| 1.6 | Adicionar `if (error) return false;` em `notifyAdmins` | [notificationService:83](src/services/notificationService.ts#L83) |
| 1.7 | Substituir `try/catch (e) {}` por log encapsulado em `deleteRequest` | [requestService:218](src/services/requestService.ts#L218) |
| 1.8 | Decidir `getRequestById` — corrigir tipo para `Promise<ITRequest>` ou tratar erro como `undefined` | [requestService:118](src/services/requestService.ts#L118) |
| 1.9 | Dashboard chartData incluir os tipos faltantes | [Dashboard:45](src/pages/Dashboard/DashboardPage.tsx#L45) |
| 1.10 | Adicionar `DEFAULT now()` em `solicitacoes.createdat` (banco) | banco |
| 1.11 | Remover `criada_em` do payload em `notificationService` (banco já preenche) | [notificationService:29,80](src/services/notificationService.ts#L29) |
| 1.12 | Reescrever `criar_manutencao_preventiva_em_lote` para EN-US, SLA 120h, idempotência | banco |
| 1.13 | Decidir: deletar `criar_solicitacao_customizada` (não usada) e `admin_list_users` (inerte), ou consertá-las | banco |
| 1.14 | Migração de dados PT-BR → EN-US: 17 linhas | banco (UPDATE) |

## 🔴 FASE 2 — Refatorações arquiteturais

| # | O quê |
|---|---|
| 2.1 | Criar `userService` para concentrar `getUserIdByEmail`, `getAdmins`, etc. (elimina 6 calls Supabase no RequestDetailPage e duplicação no NotificationContext) |
| 2.2 | Criar `storageService` para `createSignedUrl`, `uploadAttachment`, `deleteFolder` |
| 2.3 | Conectar `requestService` ao `adminAssignments.ts` (resolve hardcode "Nivaldo") |
| 2.4 | Migrar UUID literal "sistema_eugenio" para `adminAssignments.ts` (ou para coluna `usuarios.responsibility_tag`) |
| 2.5 | Decidir destino da automação semestral (instalar `pg_cron` + chamar `criar_manutencao_preventiva_em_lote` saneada via cron) |
| 2.6 | Decidir migração de `attachments[].signatureData` (base64) para Storage com signed URL |

## 🟠 FASE 3 — Tipagem honesta (ligando Strict gradualmente)

| # | O quê |
|---|---|
| 3.1 | Atualizar `RequestStatus`/`RequestType`/`RequestPriority` com valores reais (incluir `'rejected'`, ou normalizar tudo para EN-US e remover variantes) |
| 3.2 | Tipar `Notification.tipo` como union literal |
| 3.3 | Eliminar todos os `as any` e `error: any` |
| 3.4 | Eliminar imports órfãos |
| 3.5 | **Só então** ligar `noUnusedLocals: true`, depois `strict: true`, depois `strictNullChecks: true` no `tsconfig.app.json` — nessa ordem |

## 🟡 FASE 4 — Vitrine (UI/Estilo)

| # | O quê |
|---|---|
| 4.1 | Expandir `iconMapping` em [`src/lib/utils.ts`](src/lib/utils.ts) para cobrir todos os ~30 ícones em uso |
| 4.2 | Substituir imports diretos de `lucide-react` por `getSemanticIcon` em todos os arquivos da Seção 7.1 |
| 4.3 | Substituir cores cruas por tokens `text-destructive`/`text-success`/`bg-status-*` |
| 4.4 | Remover hex inline do Tailwind config — usar `hsl(var(--success))` etc. |
| 4.5 | Substituir `<input>`/`<label>`/`<table>` HTML por componentes shadcn |
| 4.6 | Substituir `window.confirm` por `<AlertDialog>` |
| 4.7 | Centralizar mensagens duplicadas em `messages.ts` |
| 4.8 | Traduzir `NotFound.tsx` para PT-BR |
| 4.9 | Limpar `App.css` (deletar boilerplate Vite) |
| 4.10 | Remover componentes UI mortos (`evervault-background`, `border-beam`, `moving-border`, `placeholders-and-vanish-input`, função `LoginForm` interna do `evervault-card`) |
| 4.11 | Decidir entre `sonner` e `@radix-ui/react-toast`, remover o outro |
| 4.12 | Remover `"use client"` directives |
| 4.13 | Remover `EvervaultBackground` e similares se confirmados sem uso |

## 🔧 FASE 5 — Decomposição do `RequestDetailPage`

**Última fase.** Quebrar o componente "deus" de 1.629 linhas em ~6-8 arquivos:
- `useRequestDetail(id)` — hook que substitui `useState<ITRequest>` + `useEffect` de fetch.
- `useReopenDialog`, `useRejectDialog`, `useExtendDeadlineDialog`, `useResolutionDialog`, `useDeliveryItemsDialog` — 1 hook por modal.
- `<RequestHeader>`, `<RequestComments>`, `<RequestAttachments>`, `<RequestLifecycleLinks>` — 1 componente por seção.
- Extrair regex de itens de descrição para `src/utils/extract-delivery-items.ts` com testes.

## 🗄️ FASE 6 — Banco

| # | O quê |
|---|---|
| 6.1 | Adicionar foreign keys com `ON DELETE CASCADE`/`SET NULL` apropriados |
| 6.2 | Adicionar `CHECK constraint` em `status`, `priority`, `type`, `role`, `approvalstatus` (após migração 1.14) |
| 6.3 | `CREATE INDEX ON notificacoes (para, criada_em DESC)` |
| 6.4 | Adicionar `file_size_limit` aos buckets |
| 6.5 | Remover constraint `user_settings_id_unique` redundante |
| 6.6 | Remover coluna morta `notificacoes.enviado_whatsapp` (depois de confirmação) |
| 6.7 | Remover coluna `user_settings.theme` morta |
| 6.8 | Limpar tabela `feriados` (criar quando o roadmap de SLA com feriados for ativado) |

---

# 12. ❓ Decisões pendentes do Operador

Sem essas respostas, vários itens da Seção 11 ficam em aberto.

## 🚨 Críticas (Fase 0)

1. **Autenticação:** Supabase Auth nativo, hash custom com `pgcrypto`, ou aceitar formalmente como interno?
2. **Rota `/aceite/:id`:** confirmar que continua pública (sem login) — define como a policy de leitura específica deve ser desenhada.
3. **Quem ativa `criar_manutencao_preventiva_em_lote` hoje?** — define se podemos deletar ou se precisa de cron.
4. **Quem é "Eugênio" (UUID `5eb6f9f4-...`)?** — registro precisa existir em `usuarios` e ter regra clara.

## 🔴 Funcionais

5. **Migrar 17 linhas PT-BR para EN-US?** Ou aceitar bilíngue documentado?
6. **Status `'rejected'` deve estar no `RequestStatus`?** Ou removemos do código?
7. **`<Toaster>`:** sonner ou radix?
8. **Coluna `notifications_enabled` é o nome canônico?** Ou trocar para `browser_notifications` no schema?
9. **`SettingsPage` `theme`:** salvar no banco também ou só localStorage?
10. **Base64 de assinatura no JSONB:** manter ou migrar para Storage?

## 🟠 Arquiteturais

11. **Strict TS:** ligar gradualmente quando?
12. **Realtime para notificações** (substituir polling de 2min)?
13. **Documentar `pageSize: 1000`** como decisão arquitetural justificada (volume real é pequeno)?
14. **Decompor `RequestDetailPage`:** aprovar como projeto separado?

## 🟡 Cosméticas

15. **Texto inglês em `NotFound.tsx`:** intencional ou tradução?
16. **`window.confirm`:** padronizar para `AlertDialog`?
17. **`EvervaultCard` no login:** manter ou substituir por componente mais simples?

## 📐 Específicas do banco

18. **`SLA real de 960h` nos 51 chamados de manutenção:** alguém alterou em massa? Manter assim ou normalizar para 120h?
19. **`ALTER COLUMN solicitacoes.id TYPE varchar(11)`:** mudar para o tamanho real, ou manter `varchar(13)` "por segurança"?
20. **Coluna `pos 2` perdida:** investigar histórico de migrations?

---

# 13. 📚 Referências oficiais consultadas

## Documentação interna (verdade canônica do projeto)
- [`/Users/niv/solicitacaoti/CLAUDE.md`](CLAUDE.md) — Protocolo de auditoria
- [`/Users/niv/solicitacaoti/CONTRIBUTING.md`](CONTRIBUTING.md) — Diretrizes de arquitetura
- [`/Users/niv/solicitacaoti/README.md`](README.md) — Documentação técnica do sistema

## Documentação oficial das stacks
- [React 18 docs](https://react.dev) — hooks, useEffect, useContext
- [TypeScript Handbook — Strict Family](https://www.typescriptlang.org/tsconfig/#strict)
- [TypeScript — `useUnknownInCatchVariables`](https://www.typescriptlang.org/tsconfig#useUnknownInCatchVariables)
- [Vite — Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase — Auth with Passwords](https://supabase.com/docs/guides/auth/passwords)
- [Supabase — pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [TanStack Query v5 — Migration Guide](https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5)
- [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL — pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [PostgreSQL — `CREATE FUNCTION` (security)](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [PostgreSQL — CHECK constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS)
- [Tailwind CSS — Theme Configuration](https://tailwindcss.com/docs/theme)
- [Radix UI — Toast](https://www.radix-ui.com/primitives/docs/components/toast)
- [shadcn/ui — Toast](https://ui.shadcn.com/docs/components/toast)
- [shadcn/ui — Alert Dialog](https://ui.shadcn.com/docs/components/alert-dialog)

## Segurança
- [OWASP Top 10 — 2021](https://owasp.org/www-project-top-ten/)
- [OWASP — A01:2021 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP — A02:2021 Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [OWASP — A07:2021 Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP — Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

## Compliance
- [LGPD — Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) — Art. 18 (Direitos do Titular), Art. 46 (Medidas de Segurança), Art. 9º §1º (Retenção)
- [ISO/IEC 9001:2015](https://www.iso.org/standard/62085.html) — Rastreabilidade

---

## 📊 Placar final (snapshot inicial 28/04/2026)

| Categoria | Quantidade inicial |
|---|---|
| 🚨 Brechas críticas de segurança | **6** |
| 🔴 Bugs funcionais confirmados | **28** |
| 🟠 Violações de protocolo interno | **~75** (concentradas em ~21 arquivos) |
| 🟡 Higiene / código morto | **~60** |
| 📐 Bugs de tipagem mascarados | **10** |
| 🗄️ Achados específicos do banco | **10** |
| ❓ Decisões pendentes | **20** |

**Total mapeado:** ~205 itens, distribuídos em ~50 arquivos + 4 tabelas + 5 funções + 6 policies.

---

## 📊 Placar pós-correções (atualizado 29/04/2026)

Após 20 lotes (Caixas 1 a 6), o estado atual é:

### ✅ Resolvidos no frontend (~40 itens)

**Bugs funcionais:**
- 6.1 `<Toaster />` não renderizado — resolvido (Lote 1).
- 6.2 SLA fantasma de 48h — resolvido (Lote 12).
- 6.4 Hardcode "Nivaldo" — resolvido (Lotes 9 e 15).
- 6.5 Hardcode UUID Eugênio — resolvido (Lote 9).
- 6.7 `uploadFile` com path errado — resolvido (Lote 3).
- 6.8 `SettingsPage` mismatch de coluna — resolvido (Lote 3).
- 6.9 `ThemeContext` ignorando localStorage — resolvido (Lote 4).
- 6.10 `use-robust-query meta.onError` morto — resolvido (Lote 12).
- 6.11 `notifyAdmins` ignora erros — resolvido (Lote 8).
- 6.12 `try/catch (e) {}` engolindo erro de Storage — resolvido (Lote 4).
- 6.13 `JSON.parse` sem try/catch no AuthContext — resolvido (Lote 4).
- 6.14 Dashboard `chartData` órfão — resolvido por remoção do código morto (Lote 6).
- 6.15 `getRequestById` tipo mentiroso — resolvido (Lote 8).
- 6.22 Polling sem janela de tempo — resolvido com janela de 15 dias (Lote 10).
- 6.25 Função `validateFormBeforeWhatsApp` morta — removida (Lote 8).
- 6.27 `criada_em` gerado no front — resolvido (Lote 9).

**Brechas de segurança parciais (front):**
- `window.supabase = supabase` global — removido (Lote 2).
- URL Supabase literal em rota pública — migrada para `import.meta.env.VITE_SUPABASE_URL` (Lote 2 e 16).

**Tipagem (Seção 9):**
- 9.1 `RequestStatus` adicionar `'rejected'` — feito (Lote 11).
- 9.5 `Notification.tipo` união literal — feito como `NotificationType` (Lote 12).
- `error: any` literal em `RequestDetailPage` (2 ocorrências) — eliminado (Lote 11).
- `as any` em `AllRequestsPage` (10 ocorrências) — eliminado (Lote 11).
- `getRequestById` tipo de retorno — corrigido (Lote 8).

**Violações de protocolo (Seção 7):**
- 7.1 Importação direta de `lucide-react` (18 arquivos / 75+ usos) — eliminada (Lotes 17, 18 e 19) — `iconMapping` central com 59 entradas.
- 7.2 Hex inline em JSX (4 arquivos × 2 cores) — substituído por CSS variables `--hover-gradient-from/to` + classes utilitárias `dark-hover-gradient`, `dark-active-tone` (Lote 20).
- 7.2 Cores cruas Tailwind (~30 ocorrências) — substituídas por tokens semânticos `destructive`, `success`, `warning`, `primary`, `muted-foreground` (Lote 20).
- 7.3 Chamadas Supabase diretas a `usuarios` (18 ocorrências) — todas migradas para `userService` (Lote 15).
- 7.3 Chamadas a `Storage` em componentes (5 ocorrências) — todas migradas para `storageService` (Lote 16).
- 7.5 `console.error` sem guard em `adminAssignments.ts` — corrigido (Lote 8).
- Logs faltantes nos catches do `RequestDetailPage` (5 ocorrências) — adicionados (Lote 4).
- `traduzirTitulo` duplicada em `NotificationsList` — substituída por `translate('notificationType', ...)` (Lote 10).

**Higiene / código morto (Seção 8):**
- 8.1 Componentes UI mortos (4 arquivos, ~480 linhas) — deletados (Lote 5).
- 8.1 Função interna `LoginForm` em `EvervaultCard` — removida (Lote 6).
- 8.1 `BarChart` import órfão em `DashboardPage` + variáveis mortas — removido (Lote 6).
- 8.2 Imports órfãos (~16 ocorrências espalhadas) — limpos (Lotes 5, 6, 18, 19).
- 8.3 Comentários mortos (3 arquivos) — removidos (Lote 7).
- 8.4 `App.css` boilerplate Vite (62 de 68 linhas) — limpo (Lote 7).
- 8.12 `"use client"` directives — removidas (Lote 5).
- `window.confirm` em RequestDetailPage e UsersPage — substituído por `<AlertDialog>` shadcn (Lote 13).
- 8.11 Texto inglês em `NotFound.tsx` — traduzido para PT-BR (Lote 8).

**Refatoração arquitetural (Caixa 5):**
- Criado `userService.ts` com 13 funções públicas (Lote 14).
- Criado `storageService.ts` com 6 funções públicas (Lote 16).

### 🚨 Pendente — Fase 0 do banco (24 itens)
Toda a Seção 5 (segurança crítica) permanece pendente por decisão do Operador (não mexer no banco antes de definir estratégia de autenticação).

### 🟠 Pendente — frontend que ainda dá pra atacar
- 9.2/9.3 `RequestType`/`RequestPriority` ainda têm valores PT-BR usados no código mas ausentes da união (depende de migração de dados PT-BR→EN-US no banco).
- `as any` em `locale-config.ts:38,132` (`(window as any)`) e `typing-animation.tsx:72` (`motion(Component as any)`).
- Cast forçado em `RequestCard.tsx:58-59`.
- 3 chamadas Supabase ainda diretas em componentes (RequestDetailPage:248, NotificationContext:35, SettingsPage).
- Strict TS — pendente ligar `noUnusedLocals`, `strict`, `strictNullChecks`.
- LoginForm — paleta "Aceternity" não migrada.
- `<input>`/`<label>`/`<table>` HTML cru em 3 arquivos.
- Refatoração estrutural do `RequestDetailPage.tsx` (1.629 linhas).

### ❓ Decisões de produto pendentes
- Estratégia de autenticação (Supabase Auth vs hash custom).
- Destino da automação semestral (`pg_cron` vs Edge Function vs front).
- i18n (`preferred_locale`).
- Base64 da assinatura no JSONB vs Storage.
- Realtime para notificações vs polling.

---

**🛑 Auditoria base concluída em 28/04/2026. Status atualizado em 29/04/2026 após 20 lotes de correção. Próxima rodada: pendente decisão sobre Fase 0.**

*Próximo passo recomendado: discutir as 4 decisões críticas (12.1 a 12.4) antes de qualquer ação de Fase 0.*
