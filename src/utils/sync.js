import { getSupabaseConfig, getSupabaseClient } from './supabase.js';
import { getAllLocalData, saveAllLocalData } from './supabase.js';
import { getUnsyncedMutations, markMutationSynced, clearSyncedMutations } from './db.js';
import { addMutation } from './db.js';

const SYNC_INTERVAL = 30000; // 30 seconds
let syncIntervalId = null;
let isSyncing = false;

// Get all local data with updated_at timestamps
export const getAllLocalDataWithTimestamps = async () => {
  const data = await getAllLocalData();
  const now = new Date().toISOString();
  
  // Add updated_at to each data type
  return {
    ...data,
    updated_at: now,
  };
};

// Save all local data with conflict resolution
export const saveAllLocalDataWithConflictResolution = async (cloudData, localData) => {
  const cloudUpdatedAt = cloudData.updated_at ? new Date(cloudData.updated_at) : null;
  const localUpdatedAt = localData.updated_at ? new Date(localData.updated_at) : null;
  
  // If cloud is newer, use cloud data
  if (cloudUpdatedAt && localUpdatedAt && cloudUpdatedAt > localUpdatedAt) {
    await saveAllLocalData(cloudData);
    return 'cloud';
  }
  
  // If local is newer, keep local data
  if (localUpdatedAt && cloudUpdatedAt && localUpdatedAt > cloudUpdatedAt) {
    return 'local';
  }
  
  // Default to cloud if no timestamps
  if (cloudData && !localUpdatedAt) {
    await saveAllLocalData(cloudData);
    return 'cloud';
  }
  
  return 'local';
};

// Sync to cloud
export const syncToCloud = async (userId) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const localData = await getAllLocalDataWithTimestamps();
    const unsyncedMutations = await getUnsyncedMutations();
    
    const { data, error } = await supabase
      .from('user_saves')
      .upsert({
        user_id: userId,
        save_data: localData,
        last_modified: new Date().toISOString(),
        mutations: unsyncedMutations,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Mark mutations as synced
    for (const mutation of unsyncedMutations) {
      await markMutationSynced(mutation.id);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Sync to cloud error:', error);
    return { success: false, error: error.message };
  }
};

// Sync from cloud
export const syncFromCloud = async (userId) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const { data: cloudData, error } = await supabase
      .from('user_saves')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data in cloud
        return { success: true, data: null, action: 'none' };
      }
      throw error;
    }

    if (!cloudData || !cloudData.save_data) {
      return { success: true, data: null, action: 'none' };
    }

    const localData = await getAllLocalDataWithTimestamps();
    const action = await saveAllLocalDataWithConflictResolution(
      cloudData.save_data,
      localData
    );

    // Apply pending mutations from cloud
    if (cloudData.mutations && Array.isArray(cloudData.mutations)) {
      for (const mutation of cloudData.mutations) {
        if (!mutation.synced) {
          // Apply mutation locally
          await addMutation(mutation.type, mutation.data);
        }
      }
    }

    return { success: true, data: cloudData, action };
  } catch (error) {
    console.error('Sync from cloud error:', error);
    return { success: false, error: error.message };
  }
};

// Bi-directional sync
export const sync = async (userId) => {
  if (isSyncing) {
    return { success: false, error: 'Sync already in progress' };
  }

  isSyncing = true;
  try {
    // First, sync from cloud to get latest
    const fromCloud = await syncFromCloud(userId);
    
    // Then, sync to cloud with local changes
    const toCloud = await syncToCloud(userId);
    
    return {
      success: fromCloud.success && toCloud.success,
      fromCloud,
      toCloud,
    };
  } finally {
    isSyncing = false;
  }
};

// Start auto-sync
export const startAutoSync = (userId) => {
  if (syncIntervalId) {
    return; // Already running
  }

  const config = getSupabaseConfig();
  if (!config || !config.enabled) {
    return; // Supabase not enabled
  }

  // Initial sync
  sync(userId).catch(console.error);

  // Periodic sync
  syncIntervalId = setInterval(() => {
    sync(userId).catch(console.error);
  }, SYNC_INTERVAL);
};

// Stop auto-sync
export const stopAutoSync = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
};

// Check if sync is enabled
export const isSyncEnabled = () => {
  const config = getSupabaseConfig();
  return config && config.enabled === true && config.userId;
};

