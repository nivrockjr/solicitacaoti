# Diretrizes de Contribuição e Arquitetura

Bem-vindo ao repositório do **Sistema Online de Solicitação de TI**. Este documento define os padrões arquiteturais, de engenharia e de design requeridos para qualquer contribuição a este projeto (seja via desenvolvedor humano ou agentes autônomos de Inteligência Artificial). 

Ao propor qualquer *Pull Request* ou alteração estrutural, certifique-se de que o código adere estritamente às diretrizes abaixo.

---

## 1. Stack Tecnológica e Infraestrutura
O sistema foi concebido com uma stack moderna voltada para estabilidade e manutenibilidade:
- **Core:** React 18 (Vite), TypeScript (Strict Mode).
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
