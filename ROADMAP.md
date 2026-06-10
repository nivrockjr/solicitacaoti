# Roadmap — Sistema de Solicitação de TI

Registro de ideias e funcionalidades em estudo para este sistema.
Cada item aqui é uma **intenção**, não uma decisão. Nada é implementado sem aprovação explícita do Operador.

Histórico do que já foi feito: [`CHANGELOG.md`](./CHANGELOG.md).
Padrões e arquitetura vigente: [`CONTRIBUTING.md`](./CONTRIBUTING.md).
Regras para agentes de IA: [`AGENTS.md`](./AGENTS.md).

---

## Legenda de status

| Status | Significado |
|---|---|
| 🔍 Em análise | Ideia sendo pesquisada e discutida. Nada foi decidido. |
| 📐 Em desenho | Abordagem aprovada. Plano de implementação sendo elaborado. |
| 🚧 Em desenvolvimento | Implementação em curso. |
| ✅ Concluído | Entrou no `CHANGELOG.md`. |

---

## 🔍 Módulo: Ativos de TI (IT Asset Management)

**Status:** Em análise — ideia a ser explorada colaborativamente com o Operador antes de qualquer decisão técnica.

### O problema que resolve

Hoje o controle de equipamentos físicos de TI não existe de forma estruturada no sistema: não há registro do que temos, onde está, quem usa, se está em garantia ou se está parado em estoque. Esse controle existe apenas na memória do Operador e em históricos de compras não consolidados.

### Contexto do sistema atual (leia estes arquivos antes de propor qualquer coisa)

- **`src/types/index.ts`** — tipos canônicos. Qualquer novo tipo deve seguir este padrão.
- **`src/services/requestService.ts`** — padrão da camada de serviços. Todo acesso ao Supabase novo deve seguir este modelo.
- **`src/components/requests/LifecycleRequestForm.tsx`** e **`src/pages/Requests/AcceptancePage.tsx`** — módulo de Ciclo de Vida do Colaborador. Este módulo tem integração prevista com Ativos de TI (onboarding/offboarding de equipamentos).
- **`src/hooks/use-request-detail.ts`** — padrão de hooks do domínio.
- Tipo existente **`equipment_request`** em `RequestType` — solicitações de equipamento já existem no sistema; a ideia é que um Ativo possa ser vinculado ao fechar esses chamados.

### Ideia inicial e escopo

Criar um menu exclusivo do administrador (Operador) chamado **"Ativos de TI"** com controle de:

1. **Equipamentos em uso** — vinculados a um usuário do sistema, com rastreabilidade de quem recebeu, quando e por qual chamado.
2. **Equipamentos em estoque** — itens comprados ainda não atribuídos.
3. **Ciclo de vida** — cada ativo percorre estados: `in_stock → in_use → under_maintenance → retired`.
4. **Identificação via código existente** — usar o serial number, código de barras ou QR code que o próprio fabricante imprime no produto. Sem etiquetas próprias.
5. **Scanner via câmera** — usar a câmera do celular para ler o código na hora do cadastro ou movimentação de um ativo. O scanner é um atalho; digitação manual sempre deve funcionar como alternativa.

### Escala real (não superestimar)

- ~100 ativos físicos no total (notebooks, desktops, monitores, mouses, teclados, headsets, celulares, telefones PABX, impressoras, webcams, microfones, adaptadores).
- ~50 usuários cadastrados no sistema (todas as filiais).
- Operador único de TI. Qualquer solução que exija manutenção complexa é desproporcional.
- **Supabase free tier.** O impacto estimado é desprezível (~200 linhas de dados + histórico de movimentações), mas toda decisão de schema deve ser validada contra os limites do plano gratuito (500MB de storage de banco, 1GB de file storage para fotos).

### Integrações previstas com módulos existentes

| Módulo existente | Integração prevista |
|---|---|
| **Ciclo de Vida — Onboarding** | Ao concluir um onboarding, sugerir ao Operador escanear os equipamentos entregues para vinculá-los ao novo colaborador (saem de `in_stock` para `in_use`). |
| **Ciclo de Vida — Offboarding** | Ao concluir um offboarding, sugerir ao Operador registrar as devoluções (voltam para `in_stock`). |
| **Solicitação de Equipamento** (`equipment_request`) | Ao fechar um chamado de equipamento aprovado, sugerir (não obrigar) vincular um ativo ao usuário solicitante. |

> Todas as integrações são **sugestivas**, não obrigatórias. O fluxo atual de fechar chamados não pode quebrar se o Operador ignorar a sugestão de vinculação.

### Restrições inegociáveis

- Stack imutável (ver `AGENTS.md`). Qualquer nova dependência precisa de aprovação explícita do Operador.
- Sem cache local de dados de domínio (localStorage/IndexedDB) — regra da arquitetura proibida em `AGENTS.md`.
- Sem SSR, Edge Functions ou qualquer recurso que exija Node no servidor.
- RLS: apenas `role = 'admin'` pode INSERT/UPDATE/DELETE nos dados de ativos.
- Design alinhado ao restante do sistema: minimalista, tokens Tailwind, zero hex inline em JSX, zero gradientes chamativos.

### Perguntas abertas (a serem exploradas com o Operador)

Estas perguntas **não têm resposta ainda**. O agente deve pesquisar, propor alternativas e aguardar decisão do Operador — nunca assumir uma resposta por conta própria.

1. **Biblioteca de scanner:** qual é a opção mais leve, com melhor suporte a TypeScript estrito e menor impacto no bundle, compatível com SPA estático? Avaliar `@yudiel/react-qr-scanner`, `html5-qrcode` e alternativas. Justificar a escolha com dados reais (tamanho, manutenção ativa, compatibilidade mobile).
2. **Schema do banco:** propor as tabelas (`ativos` e `ativos_historico`) com SQL completo — campos, tipos, constraints e RLS policies — antes de criar qualquer coisa. Inspecionar o banco real via Supabase CLI para garantir consistência com o que já existe.
3. **Fotos dos ativos:** vale a pena permitir uma foto por ativo (Supabase Storage)? Qual seria o fluxo de upload — câmera na hora do cadastro ou apenas upload de arquivo existente?
4. **Integração com Ciclo de Vida:** como o fluxo de sugestão de vinculação de ativos seria apresentado ao Operador sem quebrar ou complicar o fluxo atual de onboarding/offboarding?
5. **Por onde começar:** cadastro manual (CRUD básico sem scanner) para popular os dados primeiro, ou scanner primeiro para validar a experiência de uso mais importante?

### O que se espera de um agente ao trabalhar neste item

> **Antes de propor qualquer linha de código ou schema SQL:**
>
> 1. Ler os arquivos listados na seção "Contexto do sistema atual" acima.
> 2. Conectar ao banco via Supabase CLI e inspecionar as tabelas existentes.
> 3. Pesquisar as melhores práticas de ITAM (IT Asset Management) para operações pequenas — ISO 19770 Tier 1, ITIL para PMEs.
> 4. Fazer as perguntas abertas ao Operador e aguardar resposta antes de avançar.
> 5. Propor um plano em fases, do mais simples ao mais complexo, para aprovação.
>
> **Este item está em análise. Nenhuma implementação foi aprovada.**

---

*Roadmap mantido pelo Operador. Última revisão: 2026-06-10.*
