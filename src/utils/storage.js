// Sistema de armazenamento local
const STORAGE_KEYS = {
  PLAYER_DATA: 'leveling_player_data',
  TASKS: 'leveling_tasks',
  NOTIFICATIONS: 'leveling_notifications',
  BLOCKED: 'leveling_blocked',
  THEME: 'leveling_theme',
  SHOP_ITEMS: 'leveling_shop_items',
  SHOP_CATEGORIES: 'leveling_shop_categories',
  PURCHASED_ITEMS: 'leveling_purchased_items',
  PURCHASE_HISTORY: 'leveling_purchase_history',
  PROGRESSIVE_TASKS: 'leveling_progressive_tasks',
  TIME_TASKS: 'leveling_time_tasks',
  TITLES: 'leveling_titles',
  EARNED_TITLES: 'leveling_earned_titles',
  SELECTED_TITLE: 'leveling_selected_title',
  COMPLETED_TASKS: 'leveling_completed_tasks',
};

export const getPlayerData = () => {
  const data = localStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
  if (data) {
    const parsed = JSON.parse(data);
    // Garantir que gold existe
    if (parsed.gold === undefined) {
      parsed.gold = 0;
    }
    return parsed;
  }
  return {
    level: 1,
    xp: 0,
    gold: 0,
    skills: {
      strength: { level: 1, xp: 0 },
      vitality: { level: 1, xp: 0 },
      agility: { level: 1, xp: 0 },
      intelligence: { level: 1, xp: 0 },
      persistence: { level: 1, xp: 0 },
    },
  };
};

export const savePlayerData = (data) => {
  localStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(data));
};

export const getTasks = () => {
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = (tasks) => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const getNotifications = () => {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
};

export const saveNotification = (notification) => {
  const notifications = getNotifications();
  notifications.unshift({
    ...notification,
    id: Date.now(),
    timestamp: new Date().toISOString(),
  });
  // Manter apenas as últimas 100 notificações
  if (notifications.length > 100) {
    notifications.splice(100);
  }
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};


export const isBlocked = () => {
  const data = localStorage.getItem(STORAGE_KEYS.BLOCKED);
  return data === 'true';
};

export const setBlocked = (blocked) => {
  localStorage.setItem(STORAGE_KEYS.BLOCKED, blocked ? 'true' : 'false');
};

// Calcular XP necessário para próximo nível
export const getXPForNextLevel = (currentLevel) => {
  return currentLevel * 100;
};

// Calcular XP necessário para próximo nível de habilidade
export const getSkillXPForNextLevel = (currentLevel) => {
  return currentLevel * 50;
};

// Gerenciamento de tema
export const getSelectedTheme = () => {
  const theme = localStorage.getItem(STORAGE_KEYS.THEME);
  return theme || 'soloLeveling';
};

export const saveSelectedTheme = (themeId) => {
  localStorage.setItem(STORAGE_KEYS.THEME, themeId);
};

// Funções para gerenciar ouro do jogador
export const addGold = (amount) => {
  const playerData = getPlayerData();
  playerData.gold = (playerData.gold || 0) + amount;
  savePlayerData(playerData);
  
  // Verificar e conceder títulos após ganhar ouro
  if (amount > 0) {
    // Importação dinâmica para evitar dependência circular
    import('./titles').then(({ checkAndAwardTitles }) => {
      checkAndAwardTitles();
    });
  }
  
  return playerData.gold;
};

export const spendGold = (amount) => {
  const playerData = getPlayerData();
  if ((playerData.gold || 0) >= amount) {
    playerData.gold = playerData.gold - amount;
    savePlayerData(playerData);
    return true;
  }
  return false;
};

export const setGold = (amount) => {
  const playerData = getPlayerData();
  playerData.gold = Math.max(0, amount);
  savePlayerData(playerData);
  return playerData.gold;
};

// Funções para gerenciar categorias da loja
export const getShopCategories = () => {
  const data = localStorage.getItem(STORAGE_KEYS.SHOP_CATEGORIES);
  if (data) {
    return JSON.parse(data);
  }
  // Categorias padrão
  return [
    { id: 'default', name: 'Geral', order: 0 },
  ];
};

export const saveShopCategories = (categories) => {
  localStorage.setItem(STORAGE_KEYS.SHOP_CATEGORIES, JSON.stringify(categories));
};

// Funções para gerenciar itens da loja
export const getShopItems = () => {
  const data = localStorage.getItem(STORAGE_KEYS.SHOP_ITEMS);
  return data ? JSON.parse(data) : [];
};

export const saveShopItems = (items) => {
  localStorage.setItem(STORAGE_KEYS.SHOP_ITEMS, JSON.stringify(items));
};

// Funções para gerenciar itens comprados
export const getPurchasedItems = () => {
  const data = localStorage.getItem(STORAGE_KEYS.PURCHASED_ITEMS);
  return data ? JSON.parse(data) : [];
};

export const addPurchasedItem = (itemId) => {
  const purchased = getPurchasedItems();
  if (!purchased.includes(itemId)) {
    purchased.push(itemId);
    localStorage.setItem(STORAGE_KEYS.PURCHASED_ITEMS, JSON.stringify(purchased));
  }
};

export const isItemPurchased = (itemId) => {
  const purchased = getPurchasedItems();
  return purchased.includes(itemId);
};

// Funções para gerenciar histórico de compras
export const getPurchaseHistory = () => {
  const data = localStorage.getItem(STORAGE_KEYS.PURCHASE_HISTORY);
  return data ? JSON.parse(data) : [];
};

export const addPurchaseToHistory = (item, purchaseData = {}) => {
  const history = getPurchaseHistory();
  const purchase = {
    id: Date.now(),
    itemId: item.id,
    itemTitle: item.title,
    itemDescription: item.description,
    itemImageUrl: item.imageUrl,
    timestamp: new Date().toISOString(),
    ...purchaseData,
  };
  history.unshift(purchase);
  // Manter apenas as últimas 1000 compras
  if (history.length > 1000) {
    history.splice(1000);
  }
  localStorage.setItem(STORAGE_KEYS.PURCHASE_HISTORY, JSON.stringify(history));
  return purchase;
};

// Funções para gerenciar estado de tarefas progressivas
export const getProgressiveTasks = () => {
  const data = localStorage.getItem(STORAGE_KEYS.PROGRESSIVE_TASKS);
  if (data) {
    const parsed = JSON.parse(data);
    // Converter timestamps de string para número se necessário
    const result = {};
    Object.keys(parsed).forEach(taskId => {
      const taskState = parsed[taskId];
      result[taskId] = {
        ...taskState,
        startedAt: typeof taskState.startedAt === 'string' ? new Date(taskState.startedAt).getTime() : taskState.startedAt,
        pausedAt: taskState.pausedAt ? (typeof taskState.pausedAt === 'string' ? new Date(taskState.pausedAt).getTime() : taskState.pausedAt) : null,
        totalElapsed: taskState.totalElapsed || 0,
        paused: taskState.paused || false,
      };
    });
    return result;
  }
  return {};
};

export const saveProgressiveTasks = (progressiveTasks) => {
  localStorage.setItem(STORAGE_KEYS.PROGRESSIVE_TASKS, JSON.stringify(progressiveTasks));
};

// Funções para gerenciar estado de tarefas por tempo
export const getTimeTasks = () => {
  const data = localStorage.getItem(STORAGE_KEYS.TIME_TASKS);
  return data ? JSON.parse(data) : {};
};

export const saveTimeTasks = (timeTasks) => {
  localStorage.setItem(STORAGE_KEYS.TIME_TASKS, JSON.stringify(timeTasks));
};

// Funções para gerenciar tarefas concluídas
export const getCompletedTasks = () => {
  const data = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
  if (data) {
    const parsed = JSON.parse(data);
    // Normalizar todos os IDs para string para manter consistência
    return parsed.map(id => String(id));
  }
  return [];
};

export const saveCompletedTasks = (completedTasks) => {
  localStorage.setItem(STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify(completedTasks));
};

export const addCompletedTask = (taskId) => {
  const completedTasks = getCompletedTasks();
  // Normalizar para string para manter consistência
  const taskIdStr = String(taskId);
  // Verificar se já existe (comparando como string)
  const exists = completedTasks.some(id => String(id) === taskIdStr);
  if (!exists) {
    completedTasks.push(taskIdStr);
    saveCompletedTasks(completedTasks);
    
    // Verificar e conceder títulos após concluir tarefa
    import('./titles').then(({ checkAndAwardTitles }) => {
      checkAndAwardTitles();
    });
  }
};

export const removeCompletedTask = (taskId) => {
  const completedTasks = getCompletedTasks();
  const taskIdStr = String(taskId);
  const filtered = completedTasks.filter(id => String(id) !== taskIdStr);
  saveCompletedTasks(filtered);
};

// Funções para gerenciar títulos
export const getTitles = () => {
  const data = localStorage.getItem(STORAGE_KEYS.TITLES);
  return data ? JSON.parse(data) : [];
};

export const saveTitles = (titles) => {
  localStorage.setItem(STORAGE_KEYS.TITLES, JSON.stringify(titles));
};

// Funções para gerenciar títulos ganhos
export const getEarnedTitles = () => {
  const data = localStorage.getItem(STORAGE_KEYS.EARNED_TITLES);
  return data ? JSON.parse(data) : [];
};

export const addEarnedTitle = (titleId) => {
  const earned = getEarnedTitles();
  if (!earned.includes(titleId)) {
    earned.push(titleId);
    localStorage.setItem(STORAGE_KEYS.EARNED_TITLES, JSON.stringify(earned));
    return true; // Novo título ganho
  }
  return false; // Título já possuído
};

export const hasEarnedTitle = (titleId) => {
  const earned = getEarnedTitles();
  return earned.includes(titleId);
};

// Funções para gerenciar título selecionado
export const getSelectedTitle = () => {
  const data = localStorage.getItem(STORAGE_KEYS.SELECTED_TITLE);
  return data || null;
};

export const setSelectedTitle = (titleId) => {
  if (titleId === null) {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_TITLE);
  } else {
    localStorage.setItem(STORAGE_KEYS.SELECTED_TITLE, titleId);
  }
};

