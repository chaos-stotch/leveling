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
  
  // Debug logs (remover em produção)
  console.log('🔍 Verificando títulos...');
  console.log('📋 Títulos disponíveis:', titles.length);
  console.log('✅ Títulos já ganhos:', earnedTitles);
  console.log('✅ Tarefas concluídas:', completedTasks);
  
  const newTitles = [];
  
  titles.forEach((title) => {
    // Se já ganhou, pular (normalizar para comparação)
    const titleIdStr = String(title.id);
    if (earnedTitles.some(id => String(id) === titleIdStr)) {
      console.log(`⏭️ Título "${title.name}" já ganho, pulando...`);
      return;
    }
    
    let shouldAward = true;
    const reasons = [];
    
    // Verificar condição de nível (se requerida)
    if (title.requiresLevel) {
      if (playerData.level < title.requiredLevel) {
        shouldAward = false;
        reasons.push(`Nível insuficiente: ${playerData.level} < ${title.requiredLevel}`);
      } else {
        console.log(`✅ Nível OK: ${playerData.level} >= ${title.requiredLevel}`);
      }
    }
    
    // Verificar condição de ouro (se requerida)
    if (title.requiresGold) {
      if ((playerData.gold || 0) < title.requiredGold) {
        shouldAward = false;
        reasons.push(`Ouro insuficiente: ${playerData.gold || 0} < ${title.requiredGold}`);
      } else {
        console.log(`✅ Ouro OK: ${playerData.gold || 0} >= ${title.requiredGold}`);
      }
    }
    
    // Verificar condição de tarefas (se requerida)
    if (title.requiresTasks && title.requiredTasks && title.requiredTasks.length > 0) {
      // Normalizar IDs para string para comparação
      const completedTasksStr = completedTasks.map(id => String(id));
      // Normalizar também os IDs requeridos para string
      const requiredTasksStr = title.requiredTasks.map(id => String(id));
      
      console.log(`📝 Verificando tarefas para "${title.name}":`);
      console.log('   Tarefas requeridas:', requiredTasksStr);
      console.log('   Tarefas concluídas:', completedTasksStr);
      
      // Verificar se todas as tarefas requeridas foram concluídas
      const allTasksCompleted = requiredTasksStr.every(taskId => {
        const found = completedTasksStr.includes(taskId);
        console.log(`   - Tarefa ${taskId}: ${found ? '✅' : '❌'}`);
        return found;
      });
      
      if (!allTasksCompleted) {
        shouldAward = false;
        const missingTasks = requiredTasksStr.filter(taskId => !completedTasksStr.includes(taskId));
        reasons.push(`Tarefas faltando: ${missingTasks.join(', ')}`);
      } else {
        console.log(`✅ Todas as tarefas concluídas!`);
      }
    }
    
    // Se atendeu todas as condições requeridas, conceder título
    if (shouldAward) {
      console.log(`🎉 Concedendo título: "${title.name}"`);
      const isNew = addEarnedTitle(titleIdStr);
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
        console.log(`✅ Título "${title.name}" concedido com sucesso!`);
      } else {
        console.log(`⚠️ Título "${title.name}" já estava na lista de ganhos`);
      }
    } else {
      console.log(`❌ Título "${title.name}" não pode ser concedido:`, reasons);
    }
  });
  
  console.log(`🏆 Novos títulos ganhos: ${newTitles.length}`);
  return newTitles;
};

