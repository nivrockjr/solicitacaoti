# AGENTS.md — Guia para agentes de IA

Fonte única de instruções para qualquer agente de IA que trabalhe neste repositório
(Claude Code, Antigravity, Cursor, etc.). O Claude Code lê isto via `@AGENTS.md` no
`CLAUDE.md`; o Antigravity e outros leem direto.

A pessoa que conduz a sessão é o **Operador**. Toda decisão de escrita, edição ou
exclusão pertence a ele.

---

## Contexto do projeto (não contestar)

- Sistema interno mono-operador de chamados de TI. Tráfego previsível, escopo restrito.
- Free tier do Supabase. Soluções proporcionais — nada que dependa de cota paga.
- Sistema fechado. Só o Operador mexe em código e banco. Sem signup público.
- Stack imutável: React 18 + Vite + TS strict + Tailwind/shadcn + TanStack Query v5 +
  Supabase + auth custom (bcrypt + funções SECURITY DEFINER).
- Build estático. Sem Node no servidor: SSR, ISR, Edge Functions e API Routes não são opção.

Detalhe técnico em `CONTRIBUTING.md`. Histórico em `CHANGELOG.md`. Visão em `README.md`.

---

## Regras de ouro (conduta)

1. **Consentimento explícito.** Não fazer, sem um "SIM" claro na mensagem anterior:
   reescrever arquivo inteiro; apagar/renomear arquivo, função, rota ou export;
   instalar/atualizar/remover dependências; alterar config global (vite, tailwind,
   tsconfig, .htaccess, schema Supabase); modificar mais de um arquivo sem plano
   aprovado; rodar bash que altere o repo (push, rm, migrations). Na dúvida, perguntar.
2. **Atomicidade cirúrgica.** Uma unidade por vez (um arquivo/rota/service/componente).
   Sem varreduras gerais não solicitadas. Não "aproveitar" para outras correções.
3. **Veracidade absoluta.** Ancorar toda recomendação em doc oficial vigente ou no
   código real. Não inventar API/hook/método. Não citar versão sem conferir o package.json.
   Na incerteza, declarar e parar.
4. **Parar e perguntar** diante de regra de negócio não documentada, lógica não-óbvia
   (SLA, ciclo de vida, automação), possível bug intencional, ou conflito código×doc.

---

## Higiene de código (checklist por arquivo)

| # | Critério | Regra |
|---|---|---|
| 1 | Tipagem | Zero `any`. Usar `unknown`, generics ou tipos de `@/types`. |
| 2 | Null safety | `?.` e `??` em todo dado assíncrono. |
| 3 | Logs | `console.*` sempre dentro de `if (!import.meta.env.PROD) { ... }`. |
| 4 | Tradução | Status/categoria/prioridade via `translate(category, value)`. |
| 5 | Ícones | Usar `getSemanticIcon(name, props)`. Sem `import` direto de `lucide-react` em domínio. |
| 6 | Estilos de status | Cores e labels via `statusStyles`/`priorityStyles` de `lib/utils.ts`. |
| 7 | Cores | Sem hex em JSX. Apenas tokens (`text-primary`, `bg-destructive`…). |
| 8 | Camada de serviço | Sem `supabase.from/storage/auth/rpc` direto em components/contexts/pages. |
| 9 | Sessão | Persistência respeita `infrastructureService.ts`. |
| 10 | Error handling | `try/catch` infere tipo: `(error as Error).message`. |

Reportar cada critério como ✅ Conforme, ⚠️ Desvio ou ❌ Violação, com a linha exata.

---

## Arquitetura proibida (sem aprovação direta)

- Cache local de dados de domínio (localStorage/IndexedDB).
- `staleTime`/`gcTime` > 0 (global é `staleTime: 0` — real-time consciente).
- Service Workers, PWA, offline-first.
- Trocar TanStack Query por SWR/Apollo/Redux. Trocar Supabase por backend custom.
- Reestruturar a árvore de pastas.

Antes de "otimizar performance", perguntar: "o volume operacional real justifica?".
Sistema interno de baixo tráfego, não e-commerce.

---

## Norte de design (estilo Apple, minimalista)

Filosofia: clareza, deferência, profundidade (Apple HIG). A interface serve ao conteúdo.
O "luxo" vem do espaço, da tipografia e da consistência — nunca de efeitos chamativos.
Diais: variância de layout 3 (limpo), densidade 4 (respiro), movimento 3 (sutil).

- **Tipografia:** `system-ui`/`-apple-system` (San Francisco no Apple). Hierarquia por
  tamanho e peso, não por cor.
- **Cor:** só tokens (zero hex em JSX). Azul `primary` é o ÚNICO accent de AÇÃO; cores de
  status são funcionais (comunicam estado), não decoram. Base neutra, sem gradiente chamativo.
- **Espaço e forma:** respiro generoso, escala 4/8px; raio único (`rounded-lg`); sombra
  sutil (`shadow-sm`), sem glow.
- **Estados (todo componente):** loading (skeleton), vazio (útil), erro (claro),
  feedback tátil (`active:scale-[0.98]`). Contraste WCAG AA.
- **Movimento:** `framer-motion` já existe (migrar p/ `motion/react` só com motivo e
  aprovação). Sutil e motivado; `prefers-reduced-motion` obrigatório.
- **Dark mode:** já tem tokens; toda tela nasce testada nos dois temas.
- **Evitar "cara de IA":** sem 3 cards idênticos decorativos, emoji em títulos, gradiente
  roxo/glow, `#000` puro, nomes/números fake, verbos-clichê, indicadores de scroll.
- **Redesign (modo preservação):** auditar antes; evoluir gradual; NUNCA mudar em silêncio
  rotas, labels de nav, nomes de campo ou vocabulário de status.

---

## Gates antes de commit
`tsc --noEmit -p tsconfig.app.json` + `npm run lint` + `npm run build` limpos.
