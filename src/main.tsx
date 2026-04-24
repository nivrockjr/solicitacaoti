if (!import.meta.env.PROD) console.log("App carregando...");
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { infrastructureService } from './services/infrastructureService'
import { configureLocale } from './utils/locale-config'

// 1. Configurar locale (PT-BR)
configureLocale();

// 2. Inicializar aplicação com timeout de segurança
const startApp = () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  }
};

// Timeout de segurança: Renderiza o app mesmo se a infra demorar (evita tela branca infinita)
const initTimeout = setTimeout(() => {
  if (!import.meta.env.PROD) console.warn('⚠️ Inicialização de infra demorando demais, renderizando app por segurança...');
  startApp();
}, 2000);

// Inicialização Unificada de Infraestrutura
infrastructureService.init()
  .then(() => {
    clearTimeout(initTimeout);
    startApp();
  })
  .catch((error) => {
    clearTimeout(initTimeout);
    if (!import.meta.env.PROD) console.error('❌ Erro fatal durante inicialização:', error);
    startApp();
  });
