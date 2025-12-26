import { 
  getTitles, 
  getEarnedTitles, 
  addEarnedTitle, 
  getPlayerData, 
  getCompletedTasks,
  saveNotification 
} from './storage';

// Verificar e conceder títulos baseado nas condições
export const checkAndAwardTitles = () => {
  const titles = getTitles();
  const earnedTitles = getEarnedTitles();
  const playerData = getPlayerData();
  const completedTasks = getCompletedTasks();
  
  const newTitles = [];
  
  titles.forEach((title) => {
    // Se já ganhou, pular
    if (earnedTitles.includes(title.id)) {
      return;
    }
    
    let shouldAward = true;
    
    // Verificar condição de nível (se requerida)
    if (title.requiresLevel) {
      if (playerData.level < title.requiredLevel) {
        shouldAward = false;
      }
    }
    
    // Verificar condição de ouro (se requerida)
    if (title.requiresGold) {
      if ((playerData.gold || 0) < title.requiredGold) {
        shouldAward = false;
      }
    }
    
    // Verificar condição de tarefas (se requerida)
    if (title.requiresTasks && title.requiredTasks && title.requiredTasks.length > 0) {
      // Verificar se todas as tarefas requeridas foram concluídas
      const allTasksCompleted = title.requiredTasks.every(taskId => 
        completedTasks.includes(taskId.toString())
      );
      if (!allTasksCompleted) {
        shouldAward = false;
      }
    }
    
    // Se atendeu todas as condições requeridas, conceder título
    if (shouldAward) {
      const isNew = addEarnedTitle(title.id);
      if (isNew) {
        newTitles.push(title);
        // Criar notificação
        saveNotification({
          type: 'title_earned',
          title: 'Novo Título Desbloqueado!',
          message: `Você ganhou o título: ${title.name}`,
          titleId: title.id,
          titleName: title.name,
          sound: 'success',
        });
      }
    }
  });
  
  return newTitles;
};

