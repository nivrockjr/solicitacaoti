# Diretrizes de Contribuição e Arquitetura

Bem-vindo ao repositório do **Sistema Online de Solicitação de TI**. Este documento define os padrões arquiteturais, de engenharia e de design requeridos para qualquer contribuição a este projeto (seja via desenvolvedor humano ou agentes autônomos de Inteligência Artificial). 

Ao propor qualquer *Pull Request* ou alteração estrutural, certifique-se de que o código adere estritamente às diretrizes abaixo.

---

## 1. Stack Tecnológica e Infraestrutura
O sistema foi concebido com uma stack moderna voltada para estabilidade e manutenibilidade:
- **Core:** React 18 (Vite), TypeScript. *(Strict Mode desligado em `tsconfig.app.json` durante saneamento progressivo — ligar gradualmente conforme `DIAGNOSTICO.md` Seção 11 Fase 3.)*
- **Interface e Estilização:** Tailwind CSS acoplado ao Radix UI (implementado via `shadcn/ui`).
- **Gestão de Estado:** TanStack Query v5 (React Query) para sincronização de estado remoto.
- **Backend-as-a-Service (BaaS):** Supabase (PostgreSQL + Realtime).
- **Deploy:** Static Build. O artefato gerado em `/dist` é hospedado em ambiente Apache tradicional (sem Node.js no lado do servidor).

## 2. Princípios de Arquitetura e Performance

### 2.1. Escala Operacional e Zero-Overengineering
O sistema atende exclusivamente ao departamento interno de Tecnologia da Informação, com tráfego previsível e volume de requisições restrito.
- **Regra de Ouro:** Soluções propostas não devem introduzir complexidades arquiteturais destinadas a sistemas de alto tráfego. 
- O limite gratuito do banco de dados (Supabase) atende com ampla redundância à demanda atual. Portanto, implementações de paginação massiva em memória ou middlewares complexos são desencorajados.

### 2.2. Prioridade de Consistência (Tempo Real)
A latência de sincronização de dados entre instâncias do sistema deve ser mínima.
- O cache global (via TanStack Query) opera com `staleTime: 0`.
- É **mandatório** privilegiar leituras síncronas diretamente do Supabase para garantir que a interface sempre reflita o estado mais recente do banco de dados (UX instantânea), ignorando preocupações com economia microscópica de requisições de leitura.

> **Exceção formal de paginação:** páginas que carregam o conjunto completo (`pageSize: 1000`) são aceitáveis enquanto o volume da tabela `solicitacoes` permanecer abaixo de ~5.000 linhas. Justificativa: trade-off intencional entre Real-Time Consistency e Zero-Overengineering, dado o universo operacional pequeno (349 chamados em 10 meses, projeção de 5 anos < 5k). **Reavaliar quando a tabela cruzar 3.000 linhas.**

## 3. Padrões de Código e Manutenibilidade

### 3.1. Tipagem (Type Safety)
A higiene do código é fundamental para a estabilidade do sistema.
- O uso do tipo `any` é estritamente proibido em novas implementações.
- Tipos desconhecidos devem ser tratados via `unknown` ou interfaces declaradas em `@/types`.
- Tratamento de exceções deve inferir tipos apropriadamente (ex: `(error as Error).message`).

### 3.2. Padronização de Interface (UI)
A consistência visual é gerenciada por bibliotecas internas.
- Textos de estado e categorias (ex: Status, Prioridades) devem obrigatoriamente utilizar a função `translate(category, value)` localizada em `@/lib/utils`.
- Ícones devem ser importados exclusivamente através da função `getSemanticIcon(name, props)` para manter o design system coeso. Importações diretas do pacote `lucide-react` devem ser evitadas.
- Classes CSS devem ser construídas através do utilitário `cn()` acoplado ao `tailwind.config.ts`. O uso de cores hexadecimais inline (`#FFFFFF`) é desencorajado em favor dos tokens de design.

### 3.3. Serviços de Domínio
A lógica de negócio está separada em serviços isolados em `src/services/`. Nenhuma regra de negócio crua deve residir nos componentes React.
- **Chamados e SLAs:** Toda mutação referente ao ciclo de vida de um chamado deve transitar por `requestService.ts`.
- **Notificações:** Somente o `notificationService.ts` detém a responsabilidade de disparar alertas (internos ou Webhooks).
- **Saúde e Sessão:** O controle de inicialização, blindagem de sessão e logs ocultos são regidos pelo `infrastructureService.ts`.

**Services pendentes de criação (registrados em `DIAGNOSTICO.md` Fase 2):**
- `userService.ts` → concentrar `getUserIdByEmail`, `getAdmins`, `validateUserExists`. Hoje essas operações estão duplicadas em componentes (6 chamadas Supabase diretas em `RequestDetailPage`).
- `storageService.ts` → concentrar `uploadAttachment`, `createSignedUrl`, `deleteFolder`. Hoje vazam para componentes.

### 3.4. Monitoramento e Logs
Logs verbosos poluem o console do cliente e vazam informações de estado.
- `console.log()` é terminantemente proibido no artefato de produção. 
- Utilize o encapsulamento `if (!import.meta.env.PROD) { console.log(...) }` para qualquer instrução de debug.

---

## 4. Protocolo de Proposição de Mudanças
Antes de iniciar a refatoração ou criação de um novo módulo complexo, o contribuidor (ou IA autônoma) deve apresentar um diagnóstico claro:
1. **Identificação do Problema:** Causa raiz ou requisito de negócio.
2. **Impacto Estimado:** Quais rotas, serviços ou componentes de UI serão afetados.
3. **Justificativa de Abordagem:** O motivo pelo qual a solução proposta não fere a regra de simplicidade e consistência descrita na seção 2.1.

Qualquer alteração submetida (PR) deve ser atômica (cirúrgica) sempre que possível, evitando reescritas completas de arquivos funcionais, a menos que uma refatoração arquitetural profunda tenha sido previamente aprovada pela liderança técnica.

---

## 5. Vocabulário Canônico

Os campos `RequestStatus`, `RequestType`, `RequestPriority`, `UserRole` e `approvalstatus` no banco são **EN-US** (`'new'`, `'general'`, `'high'`, `'admin'`, etc.).

**Distribuição real (auditoria 28/04/2026):** EN-US representa 97-99% dos dados em todas as colunas tipadas.

**Histórico:** 17 linhas em `solicitacoes` foram criadas em PT-BR (`'alta'`, `'media'`, `'sistemas'`, `'solicitacao_equipamento'`, `'atribuida'`) — origem identificada em funções SQL legadas (`criar_manutencao_preventiva_em_lote`, `criar_solicitacao_customizada`) e/ou edição manual via SQL Editor.

**Regra para novas implementações:**
- Novas implementações **devem** gravar EN-US.
- Comparações que aceitam PT-BR (`'high' || 'alta'`) são **defesa contra dados legados**, não suporte bilíngue.
- Removê-las requer **migração prévia das linhas legadas** (registrada em `DIAGNOSTICO.md` Fase 1.14).

**Tipos relevantes:** ver `src/types/index.ts`.
- `RequestStatus` agora inclui `'rejected'` (atualizado 28/04/2026).
- `NotificationType` é união fechada com 9 valores EN-US canônicos + 3 PT-BR legados (`'comentario'`, `'rejeicao'`, `'prazo_estendido'`).
- Quando o tipo de notificação é derivado dinamicamente do `RequestStatus`, use `buildRequestNotificationType(status)` em `@/lib/utils` para garantir exhaustividade.

---

## 6. Decisões de Segurança Pendentes

⚠️ O sistema **ainda tem brechas críticas no banco** (status 29/04/2026). Avanços feitos no frontend, mas a Fase 0 (RLS, hash de senhas, Storage policies) permanece pendente por decisão do Operador.

**Pendente (Fase 0 — exige decisão sobre autenticação):**
1. **Autenticação:** atualmente custom com senhas em **texto plano** em `usuarios.senha` + comparação no front. Decisão pendente: migrar para Supabase Auth nativo (recomendado), ou hashar via `pgcrypto` (já instalado), ou aceitar formalmente como sistema interno fechado documentado.
2. **RLS:** todas as 4 tabelas têm policies `USING (true)` — banco aberto à `anon key` exposta no bundle JavaScript público. Reescrever policies depois da decisão #1.
3. **Storage:** policies idênticas abertas para `anexos-solicitacoes` e `guideit`. Mesmo bloqueio.
4. **Senha padrão `'senha123'`** em `UsersPage.handleCreateUser` — depende da decisão #1.
5. **Mensagem de login distingue "email não existe" vs "senha errada"** — vetor de enumeração de usuários (`AuthContext.login:43,45`).

**Já corrigido (frontend, 28-29/04/2026):**
- ✅ `window.supabase = supabase` removido de `lib/supabase.ts`.
- ✅ URL Supabase literal migrada para `import.meta.env.VITE_SUPABASE_URL` via `storageService.getGuidePdfUrl()`.

Detalhes completos com cada exploração possível em `DIAGNOSTICO.md` Seção 5.
