# 🏛️ ProjectApp - Sistema de Gestão de Projetos

Um sistema moderno e intuitivo para gerenciamento de projetos, tarefas e equipes, desenvolvido com Next.js 14, TypeScript e Supabase.

## 📋 Descrição

O ProjectApp é uma aplicação web completa para gestão de projetos de qualquer natureza. O sistema oferece uma interface moderna e responsiva para organizar projetos, listas de tarefas, sprints e pastas de documentos, facilitando o acompanhamento de processos e atividades.

## ✨ Funcionalidades Principais

### 🎯 Gestão de Projetos
- **Criação, edição e exclusão** de projetos
- **Dashboard geral** com visão consolidada de cada projeto
- **Organização hierárquica**: projetos podem conter pastas, listas e sprints
- **Templates** pré-configurados para diferentes tipos de projetos

### 📁 Organização de Conteúdo
- **Pastas**: Agrupamento de listas e documentos relacionados
- **Listas**: Controle de tarefas e atividades específicas
- **Sprints**: Gerenciamento de ciclos de trabalho e entregas
- **Hierarquia visual** clara com ícones e cores diferenciadas

### 📋 Gestão de Tarefas (Kanban)
- **Board Kanban** com colunas de status personalizáveis
- **Drag & Drop** para movimentação de tarefas entre colunas
- **Criação, edição e exclusão** de tarefas
- **Progresso visual** por tarefa (barra de progresso)
- **Priorização**, **datas de entrega**, **responsável**, **descrição**
- **Checklists** integradas em cada tarefa, com marcação dinâmica de itens
- **Ordenação inteligente** por status e nome

### 🧩 Templates de Listas
- **Modelos pré-definidos** para criação rápida de listas com campos e status customizados
- **Campos personalizados** e status específicos por template

### 📊 Dashboard do Projeto
- **Visão de listas/sprints recentes**
- **Cronograma visual** de listas/sprints (com datas, progresso e cores)
- **Gráfico de status das tarefas** (ex: pizza de status)
- **Progresso por lista, sprint e tarefa**, com indicadores visuais

### 🔐 Autenticação e Segurança
- **Autenticação Supabase** integrada
- **Controle de acesso** por usuário (cada usuário acessa apenas seus projetos)
- **Dados seguros** com backup automático

### 🎨 Interface Moderna
- **Design responsivo** para desktop e mobile
- **Tema escuro/claro** otimizado para produtividade
- **Componentes shadcn/ui** para consistência visual
- **Ícones Heroicons** para melhor usabilidade
- **Animações suaves** e transições

## 🛠️ Tecnologias Utilizadas

### Frontend
- **[Next.js 14](https://nextjs.org/)** - Framework React com App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitário
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes UI reutilizáveis
- **[Heroicons](https://heroicons.com/)** - Biblioteca de ícones

### Backend & Banco de Dados
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança em nível de linha

### Ferramentas de Desenvolvimento
- **[ESLint](https://eslint.org/)** - Linting de código
- **[Prettier](https://prettier.io/)** - Formatação de código
- **TypeScript** - Verificação de tipos

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm, yarn ou pnpm
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/licitacoes-app.git
cd licitacoes-app
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Configure o banco de dados Supabase

#### Tabelas necessárias:

**projects**
```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**lists**
```sql
CREATE TABLE lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('lista', 'sprint', 'pasta')),
  folder_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  effort_type TEXT,
  custom_effort TEXT,
  start_day TEXT,
  duration INTEGER,
  status_config TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**statuses**
```sql
CREATE TABLE statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#10B981',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**tasks**
```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status_id UUID REFERENCES statuses(id) ON DELETE CASCADE,
  assignee TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**checklist_items**
```sql
CREATE TABLE checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Políticas RLS:
```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Políticas para projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas similares para as outras tabelas...
```

### 5. Execute o projeto
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 📖 Como Usar

### 1. Primeiro Acesso
- Faça login com sua conta (o sistema usa autenticação Supabase)
- Crie seu primeiro projeto

### 2. Organizando Projetos
- **Criar projeto**: Clique no botão "+" na sidebar
- **Expandir projeto**: Clique no nome do projeto para ver suas listas, pastas e sprints
- **Criar pastas**: Use o menu de contexto do projeto → "Criar pasta"
- **Criar listas**: Use o menu de contexto do projeto → "Criar lista"
- **Criar sprints**: Use o menu de contexto do projeto → "Criar sprint"

### 3. Gerenciando Tarefas
- **Abrir lista**: Clique em uma lista para abrir o board Kanban
- **Criar status**: Use o botão "Novo Status" no board
- **Adicionar tarefa**: Clique em "Adicionar Tarefa" em qualquer coluna
- **Mover tarefas**: Arraste e solte entre as colunas
- **Editar tarefa**: Clique nos "..." ao lado da tarefa
- **Adicionar checklist**: Dentro da tarefa, adicione itens de checklist

### 4. Funcionalidades Avançadas
- **Checklists**: Adicione itens de checklist nas tarefas
- **Progresso**: Acompanhe o progresso visual das tarefas, listas e projetos
- **Templates**: Use templates pré-configurados para acelerar a criação de listas
- **Dashboard**: Visualize cronograma, progresso e gráficos do projeto

## 🏗️ Estrutura do Projeto

```
licitacoes-app/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── kanban/          # Componentes do board Kanban
│   │   │   ├── project/         # Componentes de projetos
│   │   │   ├── sidebar/         # Componentes da sidebar
│   │   │   ├── status/          # Componentes de status
│   │   │   ├── task/            # Componentes de tarefas
│   │   │   └── templates/       # Componentes de templates
│   │   ├── containers/          # Containers principais
│   │   ├── context/             # Contextos React
│   │   ├── hooks/               # Hooks customizados
│   │   ├── lib/                 # Utilitários e configurações
│   │   └── globals.css          # Estilos globais
│   └── components/
│       └── ui/                  # Componentes shadcn/ui
├── public/                      # Arquivos estáticos
├── tailwind.config.mjs          # Configuração Tailwind
├── next.config.ts               # Configuração Next.js
└── package.json                 # Dependências
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a [documentação do Supabase](https://supabase.com/docs)
2. Consulte a [documentação do Next.js](https://nextjs.org/docs)
3. Abra uma [issue](https://github.com/seu-usuario/licitacoes-app/issues) no GitHub

## 🚀 Roadmap

- [ ] **Notificações em tempo real** com Supabase Realtime
- [ ] **Relatórios e dashboards** avançados
- [ ] **Sistema de comentários** nas tarefas
- [ ] **Upload de arquivos** para documentos
- [ ] **Exportação de dados** em PDF/Excel
- [ ] **Aplicativo mobile** com React Native
- [ ] **Integração com calendário** para datas importantes

---

**Desenvolvido com ❤️ para facilitar a gestão de projetos**
