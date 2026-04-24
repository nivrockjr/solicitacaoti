# Sistema Online de Solicitação de TI

Documentação Técnica e Operacional do Sistema - Versão 1.2

## 1. Visão Geral
O **Sistema Online de Solicitação de TI** é uma plataforma centralizada para gestão de chamados, controle de ativos e automação de processos do departamento de Tecnologia da Informação. O sistema foi projetado para garantir eficiência operacional, rastreabilidade total de ativos e conformidade com normas internacionais de qualidade (ISO 9001) e proteção de dados (LGPD).

### 1.1 Contexto Operacional & Escala (Crucial para IAs)
**⚠️ Atenção Desenvolvedores e Inteligências Artificiais:** 
Este sistema possui um tráfego de uso **extremamente leve** (média de 5 a 10 solicitações diárias em dias úteis). 
O Supabase opera com imensa folga neste cenário. Portanto, **NÃO APLIQUE** sobre-engenharia (over-engineering). Caches agressivos (como `staleTime` prolongado) ou paginações complexas em memória são desencorajados. O objetivo arquitetural principal é a **Simplicidade do Código** e a **Experiência em Tempo Real (UX Instantânea)** para os poucos usuários que o utilizam.

## 2. Primeiros Passos (Getting Started)

### 2.1 Pré-requisitos (Apenas para Desenvolvimento)
*Nota: O Node.js NÃO é necessário no servidor da KingHost, apenas no computador de quem vai programar ou gerar o build.*
- Node.js (v18+) - Ferramenta necessária para rodar os comandos de desenvolvimento e construção (build).
- npm ou bun (recomendado) - Gerenciadores de pacotes.
- Conta no Supabase (Banco de Dados e Auth).

### 2.2 Instalação e Execução
1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Gere o build de produção:
   ```bash
   npm run build
   ```

### 2.3 Variáveis de Ambiente (.env)
Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## 3. Stack Técnica
O sistema utiliza tecnologias modernas para garantir performance, segurança e escalabilidade:

- **Frontend:** React 18 (Vite) com TypeScript (Strict Mode).
- **Estilização:** Tailwind CSS + Radix UI (shadcn/ui).
- **Backend:** Supabase (PostgreSQL + Realtime).
- **Gerenciamento de Estado:** TanStack Query v5 (React Query).
- **Autenticação:** Sistema de sessão customizado (Zero Persistência de senha no cliente).

## 4. Arquitetura e Organização do Código

### Camada de Serviços (src/services):
- **Infrastructure Service:** Centraliza a saúde do sistema e o gerenciamento de persistência segura (Session Shielding).
- **Request Service:** Gerencia o ciclo de vida dos chamados e cálculos de SLA.
- **Notification Service:** Único responsável pela gestão e disparo de notificações internas.
- **Holiday Service:** Gerencia o calendário de feriados para precisão operacional.
- **Preventive Maintenance Service:** Automatiza a criação de chamados de Manutenção Preventiva Semestral para todos os usuários ativos nas datas 01/03 e 01/09 de cada ano.

### Padronização e UI (src/lib/utils.ts):
- **Dicionário de Tradução:** Mapeamento centralizado de termos técnicos (EN -> PT-BR) via helper `translate()`.
- **Iconografia Semântica:** Uso obrigatório de `getSemanticIcon()` para garantir consistência visual em todo o sistema.
- **Estilos de Status:** Cores e labels centralizados em `statusStyles` e `priorityStyles`.

## 5. Segurança e Conformidade (Compliance)

### Higiene de Tipagem (Strong Typing)
- **Objetivo de Excelência**: O uso de `any` é desencorajado e está em processo de saneamento integral. O projeto visa 100% de cobertura de tipos para todos os dados assíncronos (Anexos/Comentários/Metadados/Entregas).
- **Null Safety**: Proteção rigorosa contra erros de renderização usando encadeamento opcional (`?.`) e valores padrão (`??`).

### Silent Logging (Produção)
- **Estratégia de Supressão**: Implementação mandatória de `if (!import.meta.env.PROD)` em todos os comandos `console.log`, `error` e `warn`. Isso garante que informações técnicas sensíveis (UUIDs, URLs de API, detalhes de erro) não vazem para o console do navegador em produção.

### Blindagem de Sessão (Chrome-Ready)
- Implementação de "fechou a aba, deslogou" via `infrastructureService.ts`, garantindo que sessões não persistam indevidamente após o fechamento do navegador.

### Conformidade ISO 9001 & LGPD
- **ISO 9001:2015:** Rastreabilidade total (quem solicitou, quem entregou e quem recebeu).
- **LGPD:** Coleta mínima de dados e transparência nos termos de consentimento integrados.

### Neutralidade Documental (Ciclo de Vida)
- Os termos digitais de devolução de equipamentos adotam uma postura **Técnica e Neutra**. A TI atua exclusivamente como registradora da custódia de coleta (incluindo laudos de *avarias* técnicas), direcionando qualquer resolução de litígio para o RH. Link público não deve conter aprovações mistas (Gestor vs Funcionário).

## 6. Funcionalidades Core & SLAs Oficiais

### 6.1 Acordo de Nível de Serviço (SLA)
Os prazos de vencimento são calculados automaticamente no momento da criação, com base em **horas corridas** (não dias úteis — o desconto de fins de semana e feriados está planejado para implementação futura via `holidayService`):
- **Solicitação Geral:** 120 horas corridas (~5 dias).
- **Sistemas:** 240 horas corridas (~10 dias).
- **Solicitação de Equipamentos:** 240 horas corridas (~10 dias).
- **Ciclo de Vida (Onboarding/Offboarding):** 120 horas corridas (~5 dias).
- **Manutenção Preventiva:** 120 horas corridas (~5 dias).
- **Ajuste de Estoque:** 24 horas.

### 6.2 Módulos do Sistema
- **Ciclo de Vida de Chamados:** Fluxo completo (`nova` -> `atribuida` -> `em_andamento` -> `resolvida` -> `fechada`).
- **Gestão de Ativos (Estoque):** Controle de inventário com atribuição automática inteligente.
- **Ciclo de Vida do Colaborador**: Processos de Onboarding/Offboarding com assinatura digital imutável e Automação de Rastreio Cruzado (JSON `[VINCULO_CICLO]`).
- **Capacitação e Treinamentos**: Sub-módulo para gestão de integração de novos colaboradores com trilhas de conhecimento e registro de ciência digital.
- **Chat Assistant (IA — Planejado):** Interface de chat disponível no Painel (`ChatAssistant`). Atualmente responde como placeholder visual. A integração com modelo de linguagem (IA generativa) está planejada para desenvolvimento futuro.
- **Relatórios:** Exportação nativa para PDF e Excel com métricas de SLA.

## 7. Deploy e Manutenção (KingHost)

O sistema é hospedado como um site estático na **KingHost**.
1. Execute `npm run build`.
2. Faça o upload do conteúdo da pasta `/dist` via FTP (FileZilla).
3. Certifique-se de que o arquivo `.htaccess` está na raiz do servidor para gerenciar as rotas do SPA e a segurança (CSP, HSTS).

---
*Documentação Técnica de Propriedade Intelectual. Informação Confidencial.*
