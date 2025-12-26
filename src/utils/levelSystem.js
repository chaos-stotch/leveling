import { getPlayerData, savePlayerData, getXPForNextLevel, getSkillXPForNextLevel, saveNotification } from './storage';
import { checkAndAwardTitles } from './titles';

// Adicionar XP e verificar level up
export const addXP = (amount, skillNames = null, playSound = null) => {
  const playerData = getPlayerData();
  const levelUps = [];
  const skillLevelUps = [];
  
  // Adicionar XP geral e processar múltiplos level ups
  playerData.xp += amount;
  let levelUpCount = 0;
  
  while (true) {
    const xpNeeded = getXPForNextLevel(playerData.level);
    if (playerData.xp >= xpNeeded) {
      playerData.level += 1;
      playerData.xp -= xpNeeded;
      levelUpCount++;
      levelUps.push(playerData.level);
    } else {
      break;
    }
  }
  
  // Adicionar XP de habilidades se especificadas
  // skillNames pode ser uma string (compatibilidade) ou um array
  const skillsArray = skillNames 
    ? (Array.isArray(skillNames) ? skillNames : [skillNames])
    : [];
  
  skillsArray.forEach((skillName) => {
    if (playerData.skills[skillName]) {
      playerData.skills[skillName].xp += amount;
      let skillLevelUpCount = 0;
      
      // Processar múltiplos level ups da habilidade
      while (true) {
        const skillXPNeeded = getSkillXPForNextLevel(playerData.skills[skillName].level);
        if (playerData.skills[skillName].xp >= skillXPNeeded) {
          playerData.skills[skillName].level += 1;
          playerData.skills[skillName].xp -= skillXPNeeded;
          skillLevelUpCount++;
          skillLevelUps.push({
            skill: skillName,
            level: playerData.skills[skillName].level,
          });
        } else {
          break;
        }
      }
    }
  });
  
  savePlayerData(playerData);
  
  // Criar todas as notificações primeiro (sem salvar ainda)
  const notificationsToSave = [];
  
  // Criar notificações para cada level up geral
  levelUps.forEach((level, index) => {
    notificationsToSave.push({
      type: 'level_up',
      title: 'Level Up!',
      message: `Parabéns! Você subiu para o nível ${level}!`,
      level: level,
      priority: 0, // Level geral tem prioridade 0
      sound: 'success' // Som será tocado quando a notificação aparecer
    });
  });
  
  // Criar notificação para cada habilidade que subiu de nível
  if (skillLevelUps.length > 0) {
    const skillNamesMap = {
      strength: 'Força',
      vitality: 'Vitalidade',
      agility: 'Agilidade',
      intelligence: 'Inteligência',
      persistence: 'Persistência',
    };
    
    skillLevelUps.forEach(({ skill, level }, index) => {
      notificationsToSave.push({
        type: 'skill_level_up',
        title: 'Habilidade Melhorada!',
        message: `${skillNamesMap[skill]} subiu para o nível ${level}!`,
        skill: skill,
        level: level,
        priority: 1, // Habilidades têm prioridade 1 (aparecem depois)
        sound: 'computer-processing' // Som será tocado quando a notificação aparecer
      });
    });
  }
  
  // Ordenar notificações: primeiro por prioridade (level geral primeiro), depois por nível (menor para maior)
  notificationsToSave.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.level - b.level;
  });
  
  // Reverter a ordem porque saveNotification usa unshift (adiciona no início)
  // Então salvamos do maior para o menor para que apareçam do menor para o maior
  notificationsToSave.reverse();
  
  // Salvar notificações na ordem correta
  notificationsToSave.forEach((notification) => {
    const { priority, ...notificationData } = notification;
    saveNotification(notificationData);
  });
  
  // Verificar e conceder títulos após mudanças de nível
  if (levelUps.length > 0) {
    checkAndAwardTitles();
  }
  
  return { levelUps, skillLevelUps, playerData };
};

