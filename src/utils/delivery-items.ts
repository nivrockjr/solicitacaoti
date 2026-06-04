import { ITRequest, DeliveryItem } from '@/types';

/**
 * Parsing dos itens de entrega/devolução do fluxo de Ciclo de Vida do Colaborador.
 *
 * Lógica pura (sem I/O nem React) extraída de `RequestDetailPage.handleOpenDeliveryModal`
 * no Passo B da auditoria (ver CHANGELOG 2026-06-04). O comportamento é idêntico ao
 * original — apenas movido para a camada `utils/`, seguindo o precedente de
 * `utils/lifecycle-links.ts`. A busca do onboarding de origem (`getRequestById`)
 * permanece no handler da página; aqui só transformamos os dados já carregados.
 */

/**
 * Termos genéricos que aparecem em "Recursos/Acessos:" mas não são itens reais
 * de entrega física — filtrados para não poluir o checklist.
 */
const GENERIC_ACCESS_TERMS = [
  'equipamentos',
  'equipamento',
  'sistemas',
  'acesso aos sistemas e pastas',
  'contas e canais corporativos',
  'conta_canais',
];

/**
 * Extrai os itens entregues no onboarding de origem, para conferência durante um
 * offboarding. Prioriza a meta estruturada (`metadata.delivery_items`) e cai para
 * regex na descrição como fallback. Itens iniciam **desmarcados** (`checked: false`)
 * porque ainda precisam ser conferidos na devolução. Retorna `[]` quando nada é encontrado.
 */
export function extractDeliveryItemsFromOnboarding(related: ITRequest): DeliveryItem[] {
  const metaItems = related.metadata?.delivery_items;
  if (Array.isArray(metaItems)) {
    return metaItems.map(it => ({ ...it, checked: false }));
  }

  const onbDesc = related.description || '';
  const markerMatch = onbDesc.match(/Itens a (?:Entregar|Recebidos):\n([\s\S]*)/);
  if (markerMatch && markerMatch[1]) {
    return markerMatch[1]
      .trim()
      .split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(l => ({
        id: crypto.randomUUID(),
        text: l.trim().replace(/^- /, ''),
        checked: false,
      }));
  }

  return [];
}

/**
 * Extrai os itens a partir da descrição da própria solicitação (onboarding, ou
 * fallback quando não há onboarding de origem). Itens iniciam **marcados**
 * (`checked: true`). Três estratégias, na ordem original:
 *  1. Lista já formatada com hífens (`- item`) → usa diretamente.
 *  2. Senão, linha `Recursos/Acessos:` (filtrando termos genéricos).
 *  3. Acrescenta o conteúdo de `Observações:` como itens adicionais.
 */
export function extractDeliveryItemsFromDescription(
  description: string | null | undefined
): DeliveryItem[] {
  const desc = description || '';

  // 1. Lista já formatada com hífens.
  const listMatches = desc.match(/^- .+/gm);
  if (listMatches && listMatches.length > 0) {
    return listMatches.map(m => ({
      id: crypto.randomUUID(),
      text: m.replace(/^- /, '').trim(),
      checked: true,
    }));
  }

  const items: DeliveryItem[] = [];

  // 2. Linha "Recursos/Acessos:".
  const accessMatch = desc.match(/Recursos\/Acessos: (.+)/);
  if (accessMatch && accessMatch[1]) {
    const rawItems = accessMatch[1].split(',').map(s => s.trim());
    for (const text of rawItems) {
      if (!GENERIC_ACCESS_TERMS.includes(text.toLowerCase())) {
        items.push({ id: crypto.randomUUID(), text, checked: true });
      }
    }
  }

  // 3. Conteúdo após "Observações:".
  const obsMatch = desc.match(/Observações: (.+)/s);
  if (obsMatch && obsMatch[1]) {
    const obsText = obsMatch[1].trim();
    if (obsText && obsText.length > 2) {
      const obsItems = obsText.includes(',') ? obsText.split(',') : [obsText];
      obsItems.forEach(text => {
        if (text.trim()) {
          items.push({ id: crypto.randomUUID(), text: text.trim(), checked: true });
        }
      });
    }
  }

  return items;
}
