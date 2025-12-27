import Dexie from 'dexie';

class LevelingDB extends Dexie {
  constructor() {
    super('LevelingDB');
    
    this.version(1).stores({
      playerData: 'key',
      tasks: '++id, [completed+id]',
      notifications: '++id, timestamp',
      shopItems: '++id',
      shopCategories: '++id, order',
      purchasedItems: 'itemId',
      purchaseHistory: '++id, timestamp',
      progressiveTasks: 'taskId',
      timeTasks: 'taskId',
      completedTasks: 'taskId',
      titles: '++id',
      earnedTitles: 'titleId',
      mutations: '++id, type, timestamp, synced'
    });
  }
}

const db = new LevelingDB();

// Migration from localStorage to IndexedDB
export const migrateFromLocalStorage = async () => {
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

  const migrationKey = 'leveling_migrated_to_indexeddb';
  if (localStorage.getItem(migrationKey)) {
    return; // Already migrated
  }

  try {
    // Migrate player data
    const playerData = localStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
    if (playerData) {
      await db.playerData.put({ key: 'player', value: JSON.parse(playerData) });
    }

    // Migrate tasks
    const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (tasks) {
      const tasksArray = JSON.parse(tasks);
      await db.tasks.bulkPut(tasksArray.map(task => ({ ...task, id: task.id || Date.now() })));
    }

    // Migrate notifications
    const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (notifications) {
      const notificationsArray = JSON.parse(notifications);
      await db.notifications.bulkPut(notificationsArray);
    }

    // Migrate shop items
    const shopItems = localStorage.getItem(STORAGE_KEYS.SHOP_ITEMS);
    if (shopItems) {
      const itemsArray = JSON.parse(shopItems);
      await db.shopItems.bulkPut(itemsArray);
    }

    // Migrate shop categories
    const shopCategories = localStorage.getItem(STORAGE_KEYS.SHOP_CATEGORIES);
    if (shopCategories) {
      const categoriesArray = JSON.parse(shopCategories);
      await db.shopCategories.bulkPut(categoriesArray);
    }

    // Migrate purchased items
    const purchasedItems = localStorage.getItem(STORAGE_KEYS.PURCHASED_ITEMS);
    if (purchasedItems) {
      const itemsArray = JSON.parse(purchasedItems);
      await db.purchasedItems.bulkPut(itemsArray.map(itemId => ({ itemId })));
    }

    // Migrate purchase history
    const purchaseHistory = localStorage.getItem(STORAGE_KEYS.PURCHASE_HISTORY);
    if (purchaseHistory) {
      const historyArray = JSON.parse(purchaseHistory);
      await db.purchaseHistory.bulkPut(historyArray);
    }

    // Migrate progressive tasks
    const progressiveTasks = localStorage.getItem(STORAGE_KEYS.PROGRESSIVE_TASKS);
    if (progressiveTasks) {
      const tasksObj = JSON.parse(progressiveTasks);
      await db.progressiveTasks.bulkPut(Object.entries(tasksObj).map(([taskId, value]) => ({ taskId, ...value })));
    }

    // Migrate time tasks
    const timeTasks = localStorage.getItem(STORAGE_KEYS.TIME_TASKS);
    if (timeTasks) {
      const tasksObj = JSON.parse(timeTasks);
      await db.timeTasks.bulkPut(Object.entries(tasksObj).map(([taskId, value]) => ({ taskId, ...value })));
    }

    // Migrate completed tasks
    const completedTasks = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
    if (completedTasks) {
      const tasksArray = JSON.parse(completedTasks);
      await db.completedTasks.bulkPut(tasksArray.map(taskId => ({ taskId: String(taskId) })));
    }

    // Migrate titles
    const titles = localStorage.getItem(STORAGE_KEYS.TITLES);
    if (titles) {
      const titlesArray = JSON.parse(titles);
      await db.titles.bulkPut(titlesArray);
    }

    // Migrate earned titles
    const earnedTitles = localStorage.getItem(STORAGE_KEYS.EARNED_TITLES);
    if (earnedTitles) {
      const titlesArray = JSON.parse(earnedTitles);
      await db.earnedTitles.bulkPut(titlesArray.map(titleId => ({ titleId })));
    }

    // Mark as migrated
    localStorage.setItem(migrationKey, 'true');
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Mutation queue for offline writes
export const addMutation = async (type, data) => {
  await db.mutations.add({
    type,
    data,
    timestamp: new Date().toISOString(),
    synced: false
  });
};

export const getUnsyncedMutations = async () => {
  return await db.mutations.where('synced').equals(false).toArray();
};

export const markMutationSynced = async (id) => {
  await db.mutations.update(id, { synced: true });
};

export const clearSyncedMutations = async () => {
  await db.mutations.where('synced').equals(true).delete();
};

export default db;

