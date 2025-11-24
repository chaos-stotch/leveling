# Leveling - Sistema de Gamificação para Vida Real

Um site inspirado no anime Solo Leveling que transforma tarefas do dia a dia em um sistema de RPG, onde você ganha experiência e sobe de nível ao completar tarefas.

## 🎮 Funcionalidades

### Sistema de Níveis
- **Nível Geral**: Ganhe XP completando tarefas para subir de nível
- **Habilidades Específicas**: 5 habilidades diferentes
  - 💪 Força
  - ❤️ Vitalidade
  - ⚡ Agilidade
  - 🧠 Inteligência
  - 🔥 Persistência

### Tipos de Tarefas
1. **Tarefas Comuns**: Complete manualmente e ganhe XP
2. **Tarefas por Tempo**: Inicie um timer, ao acabar ganha XP automaticamente
3. **Tarefa Diária**: Tarefa aleatória muito difícil que deve ser completada até meia-noite

### Sistema de Notificações
- Notificações em tela cheia quando:
  - Você sobe de nível geral
  - Você sobe de nível em uma habilidade
  - As tarefas são atualizadas (novo dia)

### Telas
- **Estatísticas**: Visualize seu nível, XP e progresso em todas as habilidades
- **Tarefas**: Gerencie suas tarefas (comuns, por tempo e diária)
- **Notificações**: Histórico de todas as notificações recebidas
- **Admin**: Adicione e gerencie tarefas

### Recursos Administrativos
- Adicionar tarefas com configurações personalizadas
- Tarefas quotidianas (aparecem em dias específicos da semana)
- Configurar se tarefas são substituídas ao final do dia
- Marcar tarefas que podem ser selecionadas como tarefa diária aleatória

## 🚀 Como Usar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Build para Produção

```bash
npm run build
```

## 📦 Tecnologias

- React 18
- Material-UI (MUI) 5
- Vite
- LocalStorage para persistência de dados

## 🎯 Regras do Sistema

1. **Tarefas Diárias**: Se não completar até meia-noite, o aplicativo será bloqueado até que você realize uma punição
2. **Reset Diário**: Tarefas configuradas para substituição são removidas ao final do dia
3. **Tarefas Completadas**: São removidas na meia-noite do dia em que foram completadas (ou imediatamente se configuradas para substituição)
4. **XP e Níveis**: 
   - XP necessário para próximo nível geral = nível atual × 100
   - XP necessário para próximo nível de habilidade = nível atual × 50

## 💾 Armazenamento

Todos os dados são salvos localmente no navegador usando LocalStorage:
- Dados do jogador (nível, XP, habilidades)
- Tarefas
- Notificações
- Estado de bloqueio

## 🎨 Design

Interface clean e moderna inspirada no tema Solo Leveling, totalmente responsiva para funcionar em dispositivos móveis e desktop.

