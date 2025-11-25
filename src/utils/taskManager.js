import { getTasks, saveTasks, getDailyTask, saveDailyTask, getLastDailyReset, saveLastDailyReset, setBlocked } from './storage';

// Verificar se é um novo dia
export const isNewDay = () => {
  const lastReset = getLastDailyReset();
  if (!lastReset) {
    return true;
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastResetDate = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
  return today.getTime() > lastResetDate.getTime();
};

// Verificar se passou da meia-noite
export const isPastMidnight = () => {
  const now = new Date();
  return now.getHours() === 0 && now.getMinutes() === 0;
};

// Resetar tarefas diárias
export const resetDailyTasks = (allTasks) => {
  const now = new Date();

  // Verificar tarefa diária e bloqueio
  const dailyTask = getDailyTask();
  if (dailyTask && !dailyTask.completed) {
    // Se a tarefa diária não foi completada, bloquear o app
    setBlocked(true);
  } else {
    setBlocked(false);
  }

  // Filtrar tarefas para manter - lógica simplificada e corrigida
  const tasksToKeep = allTasks.filter(task => {
    // Sempre manter tarefas base (templates) de tarefas quotidianas
    if (task.isDaily && !task.isDailyInstance) {
      return true;
    }

    // Sempre remover tarefas completadas (independentemente de quando foram completadas)
    if (task.completed) {
      return false;
    }

    // Remover tarefas não completadas que devem ser substituídas ao final do dia
    if (task.replaceAtEndOfDay) {
      return false;
    }

    // Manter tarefas comuns não completadas que não devem ser substituídas
    return true;
  });

  // Adicionar novas instâncias de tarefas quotidianas para o dia atual
  const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  const dailyTaskTemplates = allTasks.filter(task => task.isDaily && !task.isDailyInstance && task.daysOfWeek?.includes(dayOfWeek));

  dailyTaskTemplates.forEach(task => {
    // Verificar se já existe uma instância não completada desta tarefa
    const existingInstance = tasksToKeep.find(t =>
      t.isDailyInstance &&
      t.title === task.title &&
      !t.completed
    );

    if (!existingInstance) {
      tasksToKeep.push({
        ...task,
        id: Date.now() + Math.random(),
        completed: false,
        completedAt: null,
        startedAt: null,
        isDailyInstance: true,
      });
    }
  });

  saveTasks(tasksToKeep);
  saveLastDailyReset(now);

  // Gerar nova tarefa diária se necessário
  if (!dailyTask || dailyTask.completed || isNewDay()) {
    generateNewDailyTask(allTasks);
  }

  return tasksToKeep;
};

// Gerar nova tarefa diária aleatória
export const generateNewDailyTask = (allTasks) => {
  // Buscar tarefas marcadas como possíveis tarefas diárias
  const possibleDailyTasks = allTasks.filter(task => task.canBeDaily);
  
  if (possibleDailyTasks.length > 0) {
    const randomTask = possibleDailyTasks[Math.floor(Math.random() * possibleDailyTasks.length)];
    saveDailyTask({
      ...randomTask,
      id: Date.now(),
      isDailyTask: true,
      completed: false,
      createdAt: new Date().toISOString(),
    });
  }
};

// Verificar se é o dia da semana correto para tarefa diária
export const isTaskDay = (task) => {
  if (!task.isDaily || !task.daysOfWeek) return true;
  const now = new Date();
  const dayOfWeek = now.getDay();
  return task.daysOfWeek.includes(dayOfWeek);
};

