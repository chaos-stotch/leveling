// Sistema de armazenamento local com IndexedDB e localStorage fallback
import db, { migrateFromLocalStorage } from './db.js';
import { addMutation } from './db.js';

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

// Helper to use IndexedDB with localStorage fallback
const useIndexedDB = typeof indexedDB !== 'undefined';

// Initialize migration on first load
let migrationPromise = null;
export const initStorage = async () => {
  if (!migrationPromise) {
    migrationPromise = migrateFromLocalStorage();
  }
  return migrationPromise;
};

// Player Data
export const getPlayerData = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      const record = await db.playerData.get('player');
      if (record && record.value) {
        const parsed = record.value;
        if (parsed.gold === undefined) {
          parsed.gold = 0;
        }
        return parsed;
      }
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
  if (data) {
    const parsed = JSON.parse(data);
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

export const savePlayerData = async (data) => {
  await initStorage();
  if (useIndexedDB) {
    try {
      await db.playerData.put({ key: 'player', value: data });
      await addMutation('playerData', data);
      return;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  localStorage.setItem(STORAGE_KEYS.PLAYER_DATA, JSON.stringify(data));
};

// Tasks
export const getTasks = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      return await db.tasks.toArray();
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  return data ? JSON.parse(data) : [];
};

export const saveTasks = async (tasks) => {
  await initStorage();
  if (useIndexedDB) {
    try {
      await db.tasks.clear();
      if (tasks.length > 0) {
        await db.tasks.bulkPut(tasks);
      }
      await addMutation('tasks', tasks);
      return;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

// Notifications
export const getNotifications = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      return await db.notifications.orderBy('timestamp').reverse().toArray();
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
};

export const saveNotification = async (notification) => {
  await initStorage();
  const newNotification = {
    ...notification,
    id: Date.now(),
    timestamp: new Date().toISOString(),
  };
  
  if (useIndexedDB) {
    try {
      await db.notifications.add(newNotification);
      // Keep only last 100
      const count = await db.notifications.count();
      if (count > 100) {
        const toDelete = await db.notifications.orderBy('timestamp').limit(count - 100).toArray();
        await db.notifications.bulkDelete(toDelete.map(n => n.id));
      }
      await addMutation('notification', newNotification);
      return;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  
  const notifications = await getNotifications();
  notifications.unshift(newNotification);
  if (notifications.length > 100) {
    notifications.splice(100);
  }
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

// Blocked state
export const isBlocked = () => {
  const data = localStorage.getItem(STORAGE_KEYS.BLOCKED);
  return data === 'true';
};

export const setBlocked = (blocked) => {
  localStorage.setItem(STORAGE_KEYS.BLOCKED, blocked ? 'true' : 'false');
};

// XP calculations
export const getXPForNextLevel = (currentLevel) => {
  return currentLevel * 100;
};

export const getSkillXPForNextLevel = (currentLevel) => {
  return currentLevel * 50;
};

// Theme
export const getSelectedTheme = () => {
  const theme = localStorage.getItem(STORAGE_KEYS.THEME);
  return theme || 'soloLeveling';
};

export const saveSelectedTheme = (themeId) => {
  localStorage.setItem(STORAGE_KEYS.THEME, themeId);
};

// Gold management
export const addGold = async (amount) => {
  const playerData = await getPlayerData();
  playerData.gold = (playerData.gold || 0) + amount;
  await savePlayerData(playerData);
  
  if (amount > 0) {
    import('./titles').then(({ checkAndAwardTitles }) => {
      checkAndAwardTitles();
    });
  }
  
  return playerData.gold;
};

export const spendGold = async (amount) => {
  const playerData = await getPlayerData();
  if ((playerData.gold || 0) >= amount) {
    playerData.gold = playerData.gold - amount;
    await savePlayerData(playerData);
    return true;
  }
  return false;
};

export const setGold = async (amount) => {
  const playerData = await getPlayerData();
  playerData.gold = Math.max(0, amount);
  await savePlayerData(playerData);
  return playerData.gold;
};

// Shop Categories
export const getShopCategories = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      const categories = await db.shopCategories.orderBy('order').toArray();
      if (categories.length > 0) return categories;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.SHOP_CATEGORIES);
  if (data) {
    return JSON.parse(data);
  }
  return [
    { id: 'default', name: 'Geral', order: 0 },
  ];
};

export const saveShopCategories = async (categories) => {
  await initStorage();
  if (useIndexedDB) {
    try {
      await db.shopCategories.clear();
      if (categories.length > 0) {
        await db.shopCategories.bulkPut(categories);
      }
      await addMutation('shopCategories', categories);
      return;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  localStorage.setItem(STORAGE_KEYS.SHOP_CATEGORIES, JSON.stringify(categories));
};

// Shop Items
export const getShopItems = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      return await db.shopItems.toArray();
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.SHOP_ITEMS);
  return data ? JSON.parse(data) : [];
};

export const saveShopItems = async (items) => {
  await initStorage();
  if (useIndexedDB) {
    try {
      await db.shopItems.clear();
      if (items.length > 0) {
        await db.shopItems.bulkPut(items);
      }
      await addMutation('shopItems', items);
      return;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  localStorage.setItem(STORAGE_KEYS.SHOP_ITEMS, JSON.stringify(items));
};

// Purchased Items
export const getPurchasedItems = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      const items = await db.purchasedItems.toArray();
      return items.map(item => item.itemId);
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.PURCHASED_ITEMS);
  return data ? JSON.parse(data) : [];
};

export const addPurchasedItem = async (itemId) => {
  await initStorage();
  const purchased = await getPurchasedItems();
  if (!purchased.includes(itemId)) {
    purchased.push(itemId);
    if (useIndexedDB) {
      try {
        await db.purchasedItems.put({ itemId });
        await addMutation('purchasedItem', { itemId });
        return;
      } catch (error) {
        console.warn('IndexedDB error, falling back to localStorage:', error);
      }
    }
    localStorage.setItem(STORAGE_KEYS.PURCHASED_ITEMS, JSON.stringify(purchased));
  }
};

export const isItemPurchased = async (itemId) => {
  const purchased = await getPurchasedItems();
  return purchased.includes(itemId);
};

// Purchase History
export const getPurchaseHistory = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      return await db.purchaseHistory.orderBy('timestamp').reverse().toArray();
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.PURCHASE_HISTORY);
  return data ? JSON.parse(data) : [];
};

export const addPurchaseToHistory = async (item, purchaseData = {}) => {
  await initStorage();
  const purchase = {
    id: Date.now(),
    itemId: item.id,
    itemTitle: item.title,
    itemDescription: item.description,
    itemImageUrl: item.imageUrl,
    timestamp: new Date().toISOString(),
    ...purchaseData,
  };
  
  if (useIndexedDB) {
    try {
      await db.purchaseHistory.add(purchase);
      // Keep only last 1000
      const count = await db.purchaseHistory.count();
      if (count > 1000) {
        const toDelete = await db.purchaseHistory.orderBy('timestamp').limit(count - 1000).toArray();
        await db.purchaseHistory.bulkDelete(toDelete.map(p => p.id));
      }
      await addMutation('purchaseHistory', purchase);
      return purchase;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  
  const history = await getPurchaseHistory();
  history.unshift(purchase);
  if (history.length > 1000) {
    history.splice(1000);
  }
  localStorage.setItem(STORAGE_KEYS.PURCHASE_HISTORY, JSON.stringify(history));
  return purchase;
};

// Progressive Tasks
export const getProgressiveTasks = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      const tasks = await db.progressiveTasks.toArray();
      const result = {};
      tasks.forEach(task => {
        result[task.taskId] = {
          startedAt: typeof task.startedAt === 'string' ? new Date(task.startedAt).getTime() : task.startedAt,
          pausedAt: task.pausedAt ? (typeof task.pausedAt === 'string' ? new Date(task.pausedAt).getTime() : task.pausedAt) : null,
          totalElapsed: task.totalElapsed || 0,
          paused: task.paused || false,
        };
      });
      return result;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.PROGRESSIVE_TASKS);
  if (data) {
    const parsed = JSON.parse(data);
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

export const saveProgressiveTasks = async (progressiveTasks) => {
  await initStorage();
  if (useIndexedDB) {
    try {
      await db.progressiveTasks.clear();
      const entries = Object.entries(progressiveTasks).map(([taskId, value]) => ({ taskId, ...value }));
      if (entries.length > 0) {
        await db.progressiveTasks.bulkPut(entries);
      }
      await addMutation('progressiveTasks', progressiveTasks);
      return;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  localStorage.setItem(STORAGE_KEYS.PROGRESSIVE_TASKS, JSON.stringify(progressiveTasks));
};

// Time Tasks
export const getTimeTasks = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      const tasks = await db.timeTasks.toArray();
      const result = {};
      tasks.forEach(task => {
        result[task.taskId] = task;
        delete result[task.taskId].taskId;
      });
      return result;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.TIME_TASKS);
  return data ? JSON.parse(data) : {};
};

export const saveTimeTasks = async (timeTasks) => {
  await initStorage();
  if (useIndexedDB) {
    try {
      await db.timeTasks.clear();
      const entries = Object.entries(timeTasks).map(([taskId, value]) => ({ taskId, ...value }));
      if (entries.length > 0) {
        await db.timeTasks.bulkPut(entries);
      }
      await addMutation('timeTasks', timeTasks);
      return;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  localStorage.setItem(STORAGE_KEYS.TIME_TASKS, JSON.stringify(timeTasks));
};

// Completed Tasks
export const getCompletedTasks = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      const tasks = await db.completedTasks.toArray();
      return tasks.map(t => String(t.taskId));
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
  if (data) {
    const parsed = JSON.parse(data);
    return parsed.map(id => String(id));
  }
  return [];
};

export const saveCompletedTasks = async (completedTasks) => {
  await initStorage();
  if (useIndexedDB) {
    try {
      await db.completedTasks.clear();
      if (completedTasks.length > 0) {
        await db.completedTasks.bulkPut(completedTasks.map(taskId => ({ taskId: String(taskId) })));
      }
      await addMutation('completedTasks', completedTasks);
      return;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  localStorage.setItem(STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify(completedTasks));
};

export const addCompletedTask = async (taskId) => {
  const completedTasks = await getCompletedTasks();
  const taskIdStr = String(taskId);
  const exists = completedTasks.some(id => String(id) === taskIdStr);
  if (!exists) {
    completedTasks.push(taskIdStr);
    await saveCompletedTasks(completedTasks);
    
    console.log(`✅ Tarefa ${taskIdStr} marcada como concluída`);
    console.log(`📋 Tarefas concluídas agora:`, completedTasks);
    
    setTimeout(() => {
      import('./titles').then(({ checkAndAwardTitles }) => {
        console.log('🔍 Chamando checkAndAwardTitles...');
        const newTitles = checkAndAwardTitles();
        if (newTitles.length > 0) {
          console.log(`🎉 ${newTitles.length} novo(s) título(s) ganho(s)!`);
        }
      }).catch(err => {
        console.error('❌ Erro ao verificar títulos:', err);
      });
    }, 100);
  } else {
    console.log(`⚠️ Tarefa ${taskIdStr} já estava concluída`);
  }
};

export const removeCompletedTask = async (taskId) => {
  const completedTasks = await getCompletedTasks();
  const taskIdStr = String(taskId);
  const filtered = completedTasks.filter(id => String(id) !== taskIdStr);
  await saveCompletedTasks(filtered);
};

// Titles
export const getTitles = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      return await db.titles.toArray();
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.TITLES);
  return data ? JSON.parse(data) : [];
};

export const saveTitles = async (titles) => {
  await initStorage();
  if (useIndexedDB) {
    try {
      await db.titles.clear();
      if (titles.length > 0) {
        await db.titles.bulkPut(titles);
      }
      await addMutation('titles', titles);
      return;
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  localStorage.setItem(STORAGE_KEYS.TITLES, JSON.stringify(titles));
};

// Earned Titles
export const getEarnedTitles = async () => {
  await initStorage();
  if (useIndexedDB) {
    try {
      const titles = await db.earnedTitles.toArray();
      return titles.map(t => t.titleId);
    } catch (error) {
      console.warn('IndexedDB error, falling back to localStorage:', error);
    }
  }
  const data = localStorage.getItem(STORAGE_KEYS.EARNED_TITLES);
  return data ? JSON.parse(data) : [];
};

export const addEarnedTitle = async (titleId) => {
  await initStorage();
  const earned = await getEarnedTitles();
  if (!earned.includes(titleId)) {
    earned.push(titleId);
    if (useIndexedDB) {
      try {
        await db.earnedTitles.put({ titleId });
        await addMutation('earnedTitle', { titleId });
        return true;
      } catch (error) {
        console.warn('IndexedDB error, falling back to localStorage:', error);
      }
    }
    localStorage.setItem(STORAGE_KEYS.EARNED_TITLES, JSON.stringify(earned));
    return true;
  }
  return false;
};

export const hasEarnedTitle = async (titleId) => {
  const earned = await getEarnedTitles();
  return earned.includes(titleId);
};

// Selected Title
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
