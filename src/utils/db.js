import Dexie from 'dexie';

// Flag to disable IndexedDB if there are persistent issues
let indexedDBDisabled = false;
const DISABLE_KEY = 'leveling_indexeddb_disabled';

// Check if IndexedDB was previously disabled
if (typeof localStorage !== 'undefined') {
  indexedDBDisabled = localStorage.getItem(DISABLE_KEY) === 'true';
}

// Function to disable IndexedDB permanently
export const disableIndexedDB = () => {
  indexedDBDisabled = true;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DISABLE_KEY, 'true');
  }
};

// Function to check if IndexedDB is available and working
export const isIndexedDBAvailable = () => {
  return !indexedDBDisabled && typeof indexedDB !== 'undefined';
};

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

// Function to check if an error is a version error
const isVersionError = (error) => {
  return error.name === 'VersionError' || 
         error.message?.includes('higher version') || 
         error.message?.includes('VersionError') ||
         (error.inner && (error.inner.name === 'VersionError' || error.inner.message?.includes('VersionError')));
};

// Function to handle version errors by deleting and recreating the database
let versionErrorHandled = false;
export const handleVersionError = async () => {
  if (versionErrorHandled || indexedDBDisabled) {
    return false;
  }
  versionErrorHandled = true;

  try {
    console.warn('IndexedDB version mismatch detected. Attempting to fix...');
    
    // Close the database if it's open
    if (db.isOpen()) {
      db.close();
    }
    
    // Delete the database
    await Dexie.delete('LevelingDB');
    
    // Recreate it by reopening
    await db.open();
    
    console.log('IndexedDB recreated successfully');
    versionErrorHandled = false; // Reset so we can try again if needed
    return true;
  } catch (error) {
    console.error('Failed to recreate IndexedDB:', error);
    disableIndexedDB();
    versionErrorHandled = false;
    return false;
  }
};

// Wrap database operations to handle version errors
export const safeDBOperation = async (operation) => {
  if (indexedDBDisabled) {
    throw new Error('IndexedDB is disabled');
  }

  try {
    return await operation();
  } catch (error) {
    if (isVersionError(error)) {
      const fixed = await handleVersionError();
      if (fixed) {
        // Retry the operation after fixing
        try {
          return await operation();
        } catch (retryError) {
          console.error('Operation failed after database recreation:', retryError);
          throw retryError;
        }
      }
    }
    throw error;
  }
};

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
      await safeDBOperation(() => db.playerData.put({ key: 'player', value: JSON.parse(playerData) }));
    }

    // Migrate tasks
    const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (tasks) {
      const tasksArray = JSON.parse(tasks);
      await safeDBOperation(() => db.tasks.bulkPut(tasksArray.map(task => ({ ...task, id: task.id || Date.now() }))));
    }

    // Migrate notifications
    const notifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (notifications) {
      const notificationsArray = JSON.parse(notifications);
      await safeDBOperation(() => db.notifications.bulkPut(notificationsArray));
    }

    // Migrate shop items
    const shopItems = localStorage.getItem(STORAGE_KEYS.SHOP_ITEMS);
    if (shopItems) {
      const itemsArray = JSON.parse(shopItems);
      await safeDBOperation(() => db.shopItems.bulkPut(itemsArray));
    }

    // Migrate shop categories
    const shopCategories = localStorage.getItem(STORAGE_KEYS.SHOP_CATEGORIES);
    if (shopCategories) {
      const categoriesArray = JSON.parse(shopCategories);
      await safeDBOperation(() => db.shopCategories.bulkPut(categoriesArray));
    }

    // Migrate purchased items
    const purchasedItems = localStorage.getItem(STORAGE_KEYS.PURCHASED_ITEMS);
    if (purchasedItems) {
      const itemsArray = JSON.parse(purchasedItems);
      await safeDBOperation(() => db.purchasedItems.bulkPut(itemsArray.map(itemId => ({ itemId }))));
    }

    // Migrate purchase history
    const purchaseHistory = localStorage.getItem(STORAGE_KEYS.PURCHASE_HISTORY);
    if (purchaseHistory) {
      const historyArray = JSON.parse(purchaseHistory);
      await safeDBOperation(() => db.purchaseHistory.bulkPut(historyArray));
    }

    // Migrate progressive tasks
    const progressiveTasks = localStorage.getItem(STORAGE_KEYS.PROGRESSIVE_TASKS);
    if (progressiveTasks) {
      const tasksObj = JSON.parse(progressiveTasks);
      await safeDBOperation(() => db.progressiveTasks.bulkPut(Object.entries(tasksObj).map(([taskId, value]) => ({ taskId, ...value }))));
    }

    // Migrate time tasks
    const timeTasks = localStorage.getItem(STORAGE_KEYS.TIME_TASKS);
    if (timeTasks) {
      const tasksObj = JSON.parse(timeTasks);
      await safeDBOperation(() => db.timeTasks.bulkPut(Object.entries(tasksObj).map(([taskId, value]) => ({ taskId, ...value }))));
    }

    // Migrate completed tasks
    const completedTasks = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
    if (completedTasks) {
      const tasksArray = JSON.parse(completedTasks);
      await safeDBOperation(() => db.completedTasks.bulkPut(tasksArray.map(taskId => ({ taskId: String(taskId) }))));
    }

    // Migrate titles
    const titles = localStorage.getItem(STORAGE_KEYS.TITLES);
    if (titles) {
      const titlesArray = JSON.parse(titles);
      await safeDBOperation(() => db.titles.bulkPut(titlesArray));
    }

    // Migrate earned titles
    const earnedTitles = localStorage.getItem(STORAGE_KEYS.EARNED_TITLES);
    if (earnedTitles) {
      const titlesArray = JSON.parse(earnedTitles);
      await safeDBOperation(() => db.earnedTitles.bulkPut(titlesArray.map(titleId => ({ titleId }))));
    }

    // Mark as migrated
    localStorage.setItem(migrationKey, 'true');
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Mutation queue for offline writes
export const addMutation = async (type, data) => {
  try {
    await safeDBOperation(() => db.mutations.add({
      type,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    }));
  } catch (error) {
    console.error('Failed to add mutation:', error);
  }
};

export const getUnsyncedMutations = async () => {
  try {
    return await safeDBOperation(() => db.mutations.where('synced').equals(false).toArray());
  } catch (error) {
    console.error('Failed to get unsynced mutations:', error);
    return [];
  }
};

export const markMutationSynced = async (id) => {
  try {
    await safeDBOperation(() => db.mutations.update(id, { synced: true }));
  } catch (error) {
    console.error('Failed to mark mutation as synced:', error);
  }
};

export const clearSyncedMutations = async () => {
  try {
    await safeDBOperation(() => db.mutations.where('synced').equals(true).delete());
  } catch (error) {
    console.error('Failed to clear synced mutations:', error);
  }
};

export default db;
