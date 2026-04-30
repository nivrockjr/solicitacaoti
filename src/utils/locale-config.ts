/**
 * Configuração de locale para garantir que o sistema seja reconhecido como português do Brasil
 * Isso evita que o Chrome detecte o site como inglês e ofereça tradução
 */

interface PtBrFormatters {
  number: Intl.NumberFormat;
  date: Intl.DateTimeFormat;
  currency: Intl.NumberFormat;
}

interface LocaleUtils {
  configure: () => boolean;
  check: () => { checks: Record<string, boolean>; allCorrect: boolean };
  force: () => void;
  detectTranslation: () => {
    hasTranslateElements: boolean;
    hasTranslateAttributes: boolean;
    shouldOfferTranslation: boolean;
  };
}

declare global {
  interface Window {
    ptBRFormatters?: PtBrFormatters;
    localeUtils?: LocaleUtils;
  }
}

// Configurar locale padrão para português do Brasil
export const configureLocale = () => {
  try {
    // Definir locale padrão se não estiver definido
    if (!Intl.NumberFormat.supportedLocalesOf('pt-BR').length) {
      if (!import.meta.env.PROD) console.warn('Locale pt-BR não suportado pelo navegador');
    }

    // Configurar formatação de números para português
    const numberFormatter = new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    // Configurar formatação de data para português
    const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Configurar formatação de moeda para português (se necessário)
    const currencyFormatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    // Expor formatadores globalmente para uso consistente
    if (typeof window !== 'undefined') {
      window.ptBRFormatters = {
        number: numberFormatter,
        date: dateFormatter,
        currency: currencyFormatter,
      };
    }

    if (!import.meta.env.PROD) console.log('🇧🇷 Locale configurado para português do Brasil');
    return true;
  } catch (error) {
    if (!import.meta.env.PROD) console.error('Erro ao configurar locale:', error);
    return false;
  }
};

// Função para verificar se o locale está configurado corretamente
export const checkLocaleConfiguration = () => {
  const checks = {
    htmlLang: document.documentElement.lang === 'pt-BR',
    contentLanguage: document.querySelector('meta[http-equiv="Content-Language"]')?.getAttribute('content') === 'pt-BR',
    languageMeta: document.querySelector('meta[name="language"]')?.getAttribute('content') === 'pt-BR',
    ogLocale: document.querySelector('meta[property="og:locale"]')?.getAttribute('content') === 'pt_BR',
    navigatorLanguage: navigator.language.startsWith('pt'),
    intlSupport: Intl.NumberFormat.supportedLocalesOf('pt-BR').length > 0,
  };

  const allCorrect = Object.values(checks).every(check => check);
  
  if (!allCorrect) {
    if (!import.meta.env.PROD) console.warn('⚠️ Algumas configurações de locale não estão corretas:', checks);
  } else {
    if (!import.meta.env.PROD) console.log('✅ Todas as configurações de locale estão corretas');
  }

  return { checks, allCorrect };
};

// Função para forçar configuração de locale
export const forceLocaleConfiguration = () => {
  // Forçar atributo lang no HTML
  document.documentElement.lang = 'pt-BR';
  
  // Adicionar meta tags se não existirem
  if (!document.querySelector('meta[http-equiv="Content-Language"]')) {
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Language');
    meta.setAttribute('content', 'pt-BR');
    document.head.appendChild(meta);
  }

  if (!document.querySelector('meta[name="language"]')) {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'language');
    meta.setAttribute('content', 'pt-BR');
    document.head.appendChild(meta);
  }

  if (!import.meta.env.PROD) console.log('🔧 Configuração de locale forçada');
};

// Função para detectar se o Chrome está oferecendo tradução
export const detectTranslationOffer = () => {
  // Verificar se há elementos do Google Translate
  const translateElements = document.querySelectorAll('[class*="translate"], [id*="translate"]');
  const hasTranslateElements = translateElements.length > 0;
  
  // Verificar se há atributos de tradução
  const hasTranslateAttributes = document.querySelectorAll('[translate], [data-translate]').length > 0;
  
  return {
    hasTranslateElements,
    hasTranslateAttributes,
    shouldOfferTranslation: hasTranslateElements || hasTranslateAttributes,
  };
};

// Inicializar configuração automaticamente
if (typeof window !== 'undefined') {
  // Configurar locale quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configureLocale);
  } else {
    configureLocale();
  }

  // Verificar configuração após um pequeno delay
  setTimeout(() => {
    const localeCheck = checkLocaleConfiguration();
    if (!localeCheck.allCorrect) {
      forceLocaleConfiguration();
    }
  }, 1000);

  // Expor funções globalmente para debugging
  window.localeUtils = {
    configure: configureLocale,
    check: checkLocaleConfiguration,
    force: forceLocaleConfiguration,
    detectTranslation: detectTranslationOffer,
  };
} 