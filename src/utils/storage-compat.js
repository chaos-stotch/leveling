// Compatibility layer for synchronous storage access
// This provides sync wrappers that use cached data
import * as storage from './storage.js';

let playerDataCache = null;
let tasksCache = null;
let notificationsCache = null;
let shopItemsCache = null;
let shopCategoriesCache = null;
let titlesCache = null;
let earnedTitlesCache = null;
let completedTasksCache = null;
let progressiveTasksCache = null;
let timeTasksCache = null;
let purchasedItemsCache = null;

// Initialize caches
export const initCaches = async () => {
  try {
    playerDataCache = await storage.getPlayerData();
    tasksCache = await storage.getTasks();
    notificationsCache = await storage.getNotifications();
    shopItemsCache = await storage.getShopItems();
    shopCategoriesCache = await storage.getShopCategories();
    titlesCache = await storage.getTitles();
    earnedTitlesCache = await storage.getEarnedTitles();
    completedTasksCache = await storage.getCompletedTasks();
    progressiveTasksCache = await storage.getProgressiveTasks();
    timeTasksCache = await storage.getTimeTasks();
    purchasedItemsCache = await storage.getPurchasedItems();
  } catch (error) {
    console.error('Cache initialization error:', error);
  }
};

// Sync wrappers
export const getPlayerData = () => {
  if (playerDataCache) return playerDataCache;
  // Fallback to default if cache not ready
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
  playerDataCache = data;
  await storage.savePlayerData(data);
};

export const getTasks = () => {
  return tasksCache || [];
};

export const saveTasks = async (tasks) => {
  tasksCache = tasks;
  await storage.saveTasks(tasks);
};

export const getNotifications = () => {
  return notificationsCache || [];
};

export const saveNotification = async (notification) => {
  await storage.saveNotification(notification);
  notificationsCache = await storage.getNotifications();
};

export const isBlocked = storage.isBlocked;
export const setBlocked = storage.setBlocked;
export const getXPForNextLevel = storage.getXPForNextLevel;
export const getSkillXPForNextLevel = storage.getSkillXPForNextLevel;
export const getSelectedTheme = storage.getSelectedTheme;
export const saveSelectedTheme = storage.saveSelectedTheme;

export const addGold = async (amount) => {
  const result = await storage.addGold(amount);
  playerDataCache = await storage.getPlayerData();
  return result;
};

export const spendGold = async (amount) => {
  const result = await storage.spendGold(amount);
  playerDataCache = await storage.getPlayerData();
  return result;
};

export const setGold = async (amount) => {
  const result = await storage.setGold(amount);
  playerDataCache = await storage.getPlayerData();
  return result;
};

export const getShopCategories = () => {
  return shopCategoriesCache || [{ id: 'default', name: 'Geral', order: 0 }];
};

export const saveShopCategories = async (categories) => {
  shopCategoriesCache = categories;
  await storage.saveShopCategories(categories);
};

export const getShopItems = () => {
  return shopItemsCache || [];
};

export const saveShopItems = async (items) => {
  shopItemsCache = items;
  await storage.saveShopItems(items);
};

export const getPurchasedItems = () => {
  return purchasedItemsCache || [];
};

export const addPurchasedItem = async (itemId) => {
  await storage.addPurchasedItem(itemId);
  purchasedItemsCache = await storage.getPurchasedItems();
};

export const isItemPurchased = async (itemId) => {
  return await storage.isItemPurchased(itemId);
};

export const getPurchaseHistory = async () => {
  return await storage.getPurchaseHistory();
};

export const addPurchaseToHistory = async (item, purchaseData) => {
  return await storage.addPurchaseToHistory(item, purchaseData);
};

export const getProgressiveTasks = () => {
  return progressiveTasksCache || {};
};

export const saveProgressiveTasks = async (progressiveTasks) => {
  progressiveTasksCache = progressiveTasks;
  await storage.saveProgressiveTasks(progressiveTasks);
};

export const getTimeTasks = () => {
  return timeTasksCache || {};
};

export const saveTimeTasks = async (timeTasks) => {
  timeTasksCache = timeTasks;
  await storage.saveTimeTasks(timeTasks);
};

export const getCompletedTasks = () => {
  return completedTasksCache || [];
};

export const saveCompletedTasks = async (completedTasks) => {
  completedTasksCache = completedTasks;
  await storage.saveCompletedTasks(completedTasks);
};

export const addCompletedTask = async (taskId) => {
  await storage.addCompletedTask(taskId);
  completedTasksCache = await storage.getCompletedTasks();
};

export const removeCompletedTask = async (taskId) => {
  await storage.removeCompletedTask(taskId);
  completedTasksCache = await storage.getCompletedTasks();
};

export const getTitles = () => {
  return titlesCache || [];
};

export const saveTitles = async (titles) => {
  titlesCache = titles;
  await storage.saveTitles(titles);
};

export const getEarnedTitles = () => {
  return earnedTitlesCache || [];
};

export const addEarnedTitle = async (titleId) => {
  const result = await storage.addEarnedTitle(titleId);
  earnedTitlesCache = await storage.getEarnedTitles();
  return result;
};

export const hasEarnedTitle = async (titleId) => {
  return await storage.hasEarnedTitle(titleId);
};

export const getSelectedTitle = storage.getSelectedTitle;
export const setSelectedTitle = storage.setSelectedTitle;

export const getHighlightedTask = storage.getHighlightedTask;
export const setHighlightedTask = storage.setHighlightedTask;

