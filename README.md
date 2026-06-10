# Sistema Online de Solicitação de TI

Sistema interno para abertura, acompanhamento e resolução de chamados de TI.
Solicitantes registram pedidos pelo formulário; administradores atribuem, resolvem e exportam relatórios.

> 📦 SPA estático servido por Apache (sem Node.js no servidor).

---

## Stack

| Camada | Tecnologia |
|---|---|
| UI | React 18.3 + Vite 5.4 + TypeScript 5.5 (strict) |
| Estilo | Tailwind 3.4 + Radix UI via shadcn/ui |
| Estado remoto | TanStack Query v5 (`staleTime: 0`, leitura síncrona) |
| Forms | react-hook-form + Zod |
| Backend | Supabase (PostgreSQL + Storage + RLS) + Cloudflare Workers (Webhooks) |
| Integração | Meta Graph API (WhatsApp Business) |
| Auth | Custom (bcrypt via `pgcrypto` + funções `SECURITY DEFINER`) |

---

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- npm
- Acesso a um projeto Supabase (URL + anon key)

### Setup

```bash
git clone <url-do-repositorio>
cd solicitacaoti
npm install
```

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

### Comandos

```bash
npm run dev       # dev server em http://localhost:5173
npm run build     # build de produção em /dist
npm run lint      # ESLint
npm run preview   # preview do build
```

---

## Estrutura

```
src/
├── components/      # UI: shadcn/ui primitives + componentes de domínio
│   ├── ui/          # Card, Button, Dialog, etc.
│   ├── requests/    # modais e seções da página de solicitação
│   ├── users/       # diálogos de gestão de usuários
│   └── stock/       # bloco dinâmico de produtos+lotes
├── contexts/        # AuthContext, NotificationContext, ThemeContext
├── hooks/           # useRequestsData, useRobustQuery, etc.
├── lib/             # supabase client, utils (translate, getSemanticIcon, statusStyles)
├── pages/           # rotas: Dashboard, Requests, Reports, Users, Settings, Acceptance
├── services/        # única camada que conversa com o Supabase
└── types/           # tipos canônicos (ITRequest, User, Notification...)
whatsapp-worker/     # Webhook serverless (Cloudflare) híbrido (TI + Vendedores)
├── src/index.js     # Integração Meta <-> Supabase (Fluxo TI) + Roteamento
├── src/vendedores.js# Máquina de estados conversacional (Fluxo Vendas)
└── wrangler.toml    # Variáveis públicas e configuração de deploy
```

### Camada de serviços

Toda chamada ao Supabase passa por `src/services/`. Componentes nunca falam com o banco direto.

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

## SLAs (horas corridas)

Calculados em `requestService.calculateDeadline`. Tipos fora desta lista lançam erro — não há fallback silencioso.

| Tipo | Prazo |
|---|---|
| Solicitação Geral (`general`) | 120h (5 dias) |
| Sistemas (`systems`) | 240h (10 dias) |
| Equipamentos (`equipment_request`) | 240h (10 dias) |
| Ciclo de Vida (`employee_lifecycle`) | 120h (5 dias) |
| Manutenção Preventiva (`preventive_maintenance`) | 960h (40 dias) |
| Ajuste de Estoque (`ajuste_estoque`) | 72h (3 dias) |

> Cálculo em horas corridas (sem desconto de finais de semana ou feriados — opção consciente para um sistema interno de baixo tráfego).

---

## Segurança

- Senhas armazenadas como **bcrypt** em `usuarios.senha_hash`. Login passa pela função SQL `validate_login` (`SECURITY DEFINER`); o frontend nunca lê senha.
- Tabelas `usuarios` e `notificacoes` com RLS apertado: anônimo não modifica dados; operações privilegiadas passam por funções `admin_create_user`, `admin_update_user`, `admin_delete_user`, `update_user_password`, `notify_list_mine`, `notify_mark_read`, `notify_mark_all_read`.
- Storage com `file_size_limit: 10 MB` e whitelist de MIME types (PDF, imagens, Office, ZIP).
- TypeScript em strict mode, ESLint sem warnings, build limpo.

---

## Deploy

Sistema é um SPA estático. Build via `npm run build` gera `/dist`, que é servido por qualquer hospedagem com Apache (ou similar) com suporte a `.htaccess` para rotas SPA.

1. `npm run build` gera `/dist`.
2. Upload do conteúdo de `/dist` para a raiz do servidor.
3. O `.htaccess` na raiz cuida das rotas.

> Não há Node.js no servidor web — o artefato frontend é estático.
> O bot do WhatsApp roda de forma serverless na Cloudflare (deploy via `npx wrangler deploy`).

---

## Arquitetura WhatsApp (Worker Híbrido)

O diretório `whatsapp-worker/` atua como uma "portaria" unificada para os Webhooks da Meta, hospedando dois ecossistemas na mesma rota:
1. **Fluxo SolicitacaoTI (`index.js`):** Recebe eventos do Supabase, formata e envia os chamados para os usuários no WhatsApp. Gerencia cliques em botões interativos ("Verificado ✅" / "Não Resolvido ❌") e atualiza o Supabase. O acesso é bloqueado e blindado matematicamente verificando a assinatura `X-Hub-Signature-256`.
2. **Fluxo Vendedores (`vendedores.js`):** Máquina de estados assíncrona baseada em Cloudflare KV que simula um carrinho de compras de ERP no WhatsApp. Autentica vendedores e processa pedidos disparando webhooks para o backend legado em PHP (`api_whatsapp.php`). Possui documentação própria mantida fora do repositório (arquivos locais não versionados, protegidos pelo `.gitignore`).

> **Atenção:** Os dois fluxos coexistem no mesmo Worker e compartilham o mesmo número de WhatsApp. Alterações em `index.js` podem afetar ambos os fluxos. O `vendedores.js` é de outro sistema e não deve ser modificado no contexto do projeto de TI.

### Ciclo de vida das notificações TI

```
Supabase (INSERT/UPDATE em solicitacoes)
  └─► POST /supabase-webhook (Cloudflare Worker)
        ├─ Busca telefone do solicitante (requesterid) na tabela usuarios
        ├─ Formata mensagem por tipo de chamado (geral, sistemas, estoque, lifecycle…)
        └─► WhatsApp Cloud API (texto livre para o solicitante)
              │
              └─ Se status mudou para "resolved":
                   envia mensagem interativa com botões
                   ┌──────────────────┐  ┌──────────────────┐
                   │ Verificado! ✅    │  │ Não Resolvido ❌  │
                   └──────────────────┘  └──────────────────┘
                          │                       │
                  POST /meta-webhook       POST /meta-webhook
                          │                       │
                  Adiciona comentário      Adiciona comentário
                  automático no chamado    + muda status p/ "reopened"
```

**Quem recebe a notificação:** sempre o solicitante do chamado (`requesterid`). O admin/técnico não recebe notificação via WhatsApp.

### Janela de 24h da Meta (decisão consciente)

O código atual envia mensagens como **texto livre** (free-form), não como Templates da Meta. Isso significa que a Meta só entrega a mensagem se o destinatário tiver enviado algo para o número do bot nas últimas 24 horas (regra da "janela de serviço"). Fora da janela, o envio é bloqueado silenciosamente.

Esta é uma **decisão consciente**, alinhada ao princípio de zero-custo do projeto: mensagens de texto livre dentro da janela de 24h são gratuitas. Templates (que funcionam fora da janela) são cobrados por mensagem entregue (~US$ 0,03/msg para Utility no Brasil, modelo vigente desde julho/2025).

> Para que um funcionário receba notificações, ele precisa enviar uma mensagem para o número do bot pelo menos uma vez a cada 24 horas.

### Cofre de Senhas (Cloudflare Secrets)
Nenhuma chave sensível é salva no código. Para que o Worker funcione (ou para migrá-lo de ambiente), as seguintes variáveis precisam ser injetadas via painel da Cloudflare ou terminal (`npx wrangler secret put <NOME>`):

- `WHATSAPP_TOKEN`: Bearer Token de acesso à Graph API da Meta.
- `WHATSAPP_APP_SECRET`: Chave mestre gerada pela Meta (App Secret) exigida para o cálculo de assinatura e blindagem da rota contra injeções.
- `WHATSAPP_VERIFY_TOKEN`: Chave arbitrária usada na verificação do ciclo de vida inicial do webhook.
- `SUPABASE_SERVICE_ROLE_KEY`: Service Key do Supabase (bypass de RLS) para o bot poder alterar dados e incluir comentários.
- `PQVIRK_API_KEY`: Senha compartilhada que autentica o Worker quando ele chama o WampServer PHP (`api_whatsapp.php`).

---

## Documentação interna

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — padrões de código e arquitetura.
- [`AGENTS.md`](./AGENTS.md) — fonte única de instruções para agentes de IA (contexto, regras, higiene, norte de design). Portável entre ferramentas (Claude Code, Antigravity, etc.).
- [`CLAUDE.md`](./CLAUDE.md) — camada específica do Claude Code; importa o `AGENTS.md` e adiciona o protocolo de auditoria.
- [`CHANGELOG.md`](./CHANGELOG.md) — histórico das mudanças importantes.

---

## Licença

Projeto privado — uso interno.
