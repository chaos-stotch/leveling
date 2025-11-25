import { getTasks, saveTasks, getLastDailyReset, saveLastDailyReset, setBlocked } from './storage';

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

// Resetar tarefas - lógica simplificada
export const resetDailyTasks = (allTasks) => {
  const now = new Date();

  // Separar templates de instâncias
  const templates = allTasks.filter(task => !task.isInstance);
  const instances = allTasks.filter(task => task.isInstance);

  // Nova lista de tarefas: começar com todos os templates
  let tasksToKeep = [...templates];

  // Para cada template habilitado, criar uma instância não realizada se não existir
  templates.forEach(template => {
    if (template.enabled) {
      // Verificar se já existe uma instância não completada desta tarefa
      const existingInstance = instances.find(instance =>
        instance.templateId === template.id && !instance.completed
      );

      if (!existingInstance) {
        tasksToKeep.push({
          ...template,
          id: Date.now() + Math.random(),
          templateId: template.id,
          isInstance: true,
          completed: false,
          completedAt: null,
          startedAt: null,
        });
      } else {
        // Manter a instância existente se não estiver concluída
        tasksToKeep.push(existingInstance);
      }
    }
  });

  // Manter instâncias permanentes concluídas (elas só desaparecem quando desabilitadas no admin)
  instances.forEach(instance => {
    const template = templates.find(t => t.id === instance.templateId);
    if (template && template.permanent && instance.completed && template.enabled) {
      tasksToKeep.push(instance);
    }
  });

  saveTasks(tasksToKeep);
  saveLastDailyReset(now);

  return tasksToKeep;
};



