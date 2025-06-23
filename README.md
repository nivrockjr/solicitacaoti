# IT Request Tracker

Um sistema completo de gerenciamento de solicitações de TI desenvolvido em React com TypeScript, projetado para otimizar o fluxo de trabalho de suporte técnico.

## 🚀 Funcionalidades

### Core Features
- **Dashboard Interativo**: Visão geral das solicitações com métricas em tempo real
- **Gestão de Solicitações**: Criação, edição e acompanhamento de tickets
- **Sistema de Usuários**: Gerenciamento completo com diferentes níveis de acesso
- **Assistente Virtual IA**: Chat bot especializado em problemas de TI
- **Relatórios Avançados**: Exportação em PDF e Excel com filtros personalizados
- **Notificações**: Sistema de alertas em tempo real

### Recursos Técnicos
- **Autenticação Segura**: Sistema de login com diferentes níveis de permissão
- **Responsive Design**: Interface adaptável para desktop, tablet e mobile
- **Manutenção Preventiva**: Agendamento automático de tarefas
- **Controle de Estoque**: Gestão de equipamentos e materiais
- **Email Automático**: Notificações e lembretes por email

## 🛠️ Stack Tecnológica

### Frontend
- **React 18**: Interface de usuário reativa
- **TypeScript**: Tipagem estática para maior segurança
- **Vite**: Build tool moderna e rápida
- **Tailwind CSS**: Framework CSS utilitário
- **Shadcn/UI**: Componentes acessíveis e customizáveis

### Gerenciamento de Estado
- **React Query**: Cache inteligente e sincronização de dados
- **React Hook Form**: Formulários performáticos
- **Zustand**: Estado global leve (quando necessário)

### Roteamento e Navegação
- **React Router**: Navegação SPA
- **Protected Routes**: Rotas protegidas por autenticação

### UI/UX
- **Lucide React**: Ícones consistentes
- **Radix UI**: Primitivos acessíveis
- **Framer Motion**: Animações fluidas
- **Sonner**: Toast notifications

### Ferramentas de Desenvolvimento
- **Zod**: Validação de esquemas
- **Class Variance Authority**: Variantes de componentes
- **clsx/cn**: Utilitários para classes CSS

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── auth/            # Componentes de autenticação
│   ├── chat/            # Assistente virtual
│   ├── layout/          # Layout e navegação
│   ├── notifications/   # Sistema de notificações
│   ├── reports/         # Geração de relatórios
│   ├── requests/        # Gestão de solicitações
│   └── ui/             # Componentes base (shadcn/ui)
├── contexts/           # Contextos React
│   ├── AuthContext.tsx
│   ├── NotificationContext.tsx
│   └── ThemeContext.tsx
├── hooks/              # Custom hooks
├── pages/              # Páginas da aplicação
│   ├── Auth/
│   ├── Dashboard/
│   ├── Requests/
│   ├── Reports/
│   ├── Settings/
│   └── Users/
├── services/           # Lógica de negócio e APIs
│   ├── apiService.ts
│   ├── authService.ts
│   ├── requestService.ts
│   ├── aiAssistantService.ts
│   └── emailService.ts
├── types/              # Definições TypeScript
└── lib/               # Utilitários e configurações
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Navegador moderno

### Instalação

1. **Clone o repositório**
```bash
git clone [repository-url]
cd it-request-tracker
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
VITE_APP_TITLE=IT Request Tracker
VITE_API_URL=http://localhost:3000/api
VITE_EMAIL_SERVICE_ID=seu_service_id
VITE_EMAIL_TEMPLATE_ID=seu_template_id
VITE_EMAIL_PUBLIC_KEY=sua_public_key
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
# ou
yarn dev
```

5. **Acesse a aplicação**
Abra [http://localhost:5173](http://localhost:5173) no seu navegador.

## 🔐 Autenticação

### Níveis de Acesso

- **Admin**: Acesso completo ao sistema
- **Técnico**: Gestão de solicitações e relatórios
- **Usuário**: Criação e acompanhamento de solicitações próprias

## 🤖 Assistente Virtual IA

O sistema inclui um assistente virtual especializado em problemas de TI que pode:

- Diagnosticar problemas comuns de hardware
- Orientar sobre configuração de rede e internet
- Ajudar com problemas de software
- Consultar status de solicitações
- Fornecer orientações passo a passo

### Categorias de Conhecimento
- Hardware (PC, periféricos)
- Rede e Internet
- Email e comunicação
- Software e aplicativos
- Senhas e acesso
- Sistema Windows

## 📊 Relatórios e Exportação

### Tipos de Relatório
- **Solicitações por Período**: Análise temporal
- **Performance por Técnico**: Métricas de produtividade
- **Tipos de Problema**: Estatísticas por categoria
- **SLA e Prazos**: Acompanhamento de metas

### Formatos de Exportação
- **PDF**: Relatórios formatados
- **Excel**: Dados para análise
- **CSV**: Importação em outras ferramentas

## 🔧 Configuração de Email

Para configurar o envio de emails automáticos:

1. **Registre-se no EmailJS**
2. **Configure um serviço de email**
3. **Crie templates de email**
4. **Adicione as credenciais no .env**

## 🎨 Personalização

### Temas
O sistema suporta tema claro e escuro, configurável por usuário.

### Componentes
Todos os componentes seguem o design system do shadcn/ui e podem ser facilmente customizados.

## 🧪 Testes

```bash
# Executar testes unitários
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes e2e
npm run test:e2e
```

## 📦 Build e Deploy

### Build de Produção
```bash
npm run build
```

### Preview do Build
```bash
npm run preview
```

### Deploy
O projeto pode ser deployado em qualquer serviço que suporte aplicações React:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript para todas as funcionalidades
- Siga os padrões do ESLint configurado
- Componentes devem ter menos de 50 linhas
- Use hooks customizados para lógica reutilizável
- Implemente testes para novas funcionalidades

## 📝 Changelog

### v1.0.0 (2024-01-01)
- ✨ Sistema completo de gestão de solicitações
- 🤖 Assistente virtual IA
- 📊 Relatórios e dashboards
- 🔐 Sistema de autenticação
- 📧 Notificações por email
- 📱 Interface responsiva

## 🐛 Solução de Problemas

### Problemas Comuns

**Erro de build:**
```bash
# Limpar cache do node_modules
rm -rf node_modules package-lock.json
npm install
```

**Problemas de rota:**
- Verifique se está usando componentes `Link` do React Router
- Confirme a configuração das rotas protegidas

**Problemas de estilo:**
- Verifique se o Tailwind CSS está configurado corretamente
- Confirme se os componentes shadcn/ui foram importados

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Email: suporte@empresa.com
- Documentação: [Link para docs]
- Issues: [GitHub Issues]

---

**Desenvolvido com ❤️ usando React + TypeScript + Tailwind CSS**
