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
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Verificar tarefa diária
  const dailyTask = getDailyTask();
  if (dailyTask && !dailyTask.completed) {
    // Se a tarefa diária não foi completada, bloquear o app
    setBlocked(true);
  } else {
    setBlocked(false);
  }
  
  // Filtrar tarefas para manter
  const tasksToKeep = allTasks.filter(task => {
    // Não remover tarefas base (templates) de tarefas quotidianas
    if (task.isDaily && !task.isDailyInstance) {
      return true; // Manter templates de tarefas quotidianas
    }
    
    // Remover instâncias de tarefas quotidianas do dia anterior
    if (task.isDailyInstance) {
      return false; // Serão recriadas abaixo se necessário
    }
    
    // Remover tarefas que devem ser substituídas ao final do dia (não completadas)
    if (task.replaceAtEndOfDay && !task.completed) {
      return false;
    }
    
    // Se completada e replaceAtEndOfDay, remover na meia-noite do dia de conclusão
    if (task.completed && task.replaceAtEndOfDay && task.completedAt) {
      const completedDate = new Date(task.completedAt);
      const completedDay = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
      return today.getTime() <= completedDay.getTime();
    }
    
    // Se completada e não replaceAtEndOfDay, remover na meia-noite do dia de conclusão
    if (task.completed && !task.replaceAtEndOfDay && task.completedAt) {
      const completedDate = new Date(task.completedAt);
      const completedDay = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
      return today.getTime() <= completedDay.getTime();
    }
    
    return true;
  });
  
  // Adicionar tarefas quotidianas para o dia atual
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

