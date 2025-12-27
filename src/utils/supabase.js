import { createClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'leveling_supabase_config';
const LAST_SAVE_KEY = 'leveling_last_save';
const LAST_RESTORE_KEY = 'leveling_last_restore';

// Obter configuração do Supabase
export const getSupabaseConfig = () => {
  const config = localStorage.getItem(SUPABASE_CONFIG_KEY);
  if (!config) return null;
  const parsed = JSON.parse(config);
  // Default to disabled if not explicitly enabled
  if (parsed.enabled === undefined) {
    parsed.enabled = false;
  }
  return parsed;
};

// Salvar configuração do Supabase
export const saveSupabaseConfig = (config) => {
  // Ensure enabled flag exists
  const configToSave = {
    ...config,
    enabled: config.enabled !== undefined ? config.enabled : false,
  };
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(configToSave));
};

// Criar cliente Supabase
export const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config || !config.enabled || !config.url || !config.anonKey) {
    return null;
  }
  return createClient(config.url, config.anonKey);
};

// Obter último save
export const getLastSave = () => {
  const data = localStorage.getItem(LAST_SAVE_KEY);
  return data ? new Date(data) : null;
};

// Salvar timestamp do último save
export const setLastSave = () => {
  localStorage.setItem(LAST_SAVE_KEY, new Date().toISOString());
};

// Obter última restauração
export const getLastRestore = () => {
  const data = localStorage.getItem(LAST_RESTORE_KEY);
  return data ? new Date(data) : null;
};

// Salvar timestamp da última restauração
export const setLastRestore = () => {
  localStorage.setItem(LAST_RESTORE_KEY, new Date().toISOString());
};

// Obter todos os dados locais para sincronização
export const getAllLocalData = async () => {
  // Import storage functions dynamically to avoid circular dependency
  const storage = await import('./storage.js');
  
  const playerData = await storage.getPlayerData();
  const tasks = await storage.getTasks();
  const notifications = await storage.getNotifications();
  const shopItems = await storage.getShopItems();
  const shopCategories = await storage.getShopCategories();
  const purchasedItems = await storage.getPurchasedItems();
  const purchaseHistory = await storage.getPurchaseHistory();
  const completedTasks = await storage.getCompletedTasks();
  const titles = await storage.getTitles();
  const earnedTitles = await storage.getEarnedTitles();
  
  return {
    player_data: JSON.stringify(playerData),
    tasks: JSON.stringify(tasks),
    notifications: JSON.stringify(notifications),
    blocked: localStorage.getItem('leveling_blocked'),
    theme: localStorage.getItem('leveling_theme'),
    shop_items: JSON.stringify(shopItems),
    shop_categories: JSON.stringify(shopCategories),
    purchased_items: JSON.stringify(purchasedItems),
    purchase_history: JSON.stringify(purchaseHistory),
    completed_tasks: JSON.stringify(completedTasks),
    titles: JSON.stringify(titles),
    earned_titles: JSON.stringify(earnedTitles),
    selected_title: localStorage.getItem('leveling_selected_title'),
  };
};

// Salvar todos os dados locais
export const saveAllLocalData = async (data) => {
  const storage = await import('./storage.js');
  
  if (data.player_data) {
    await storage.savePlayerData(JSON.parse(data.player_data));
  }
  if (data.tasks) {
    await storage.saveTasks(JSON.parse(data.tasks));
  }
  if (data.notifications) {
    const notifications = JSON.parse(data.notifications);
    for (const notif of notifications) {
      await storage.saveNotification(notif);
    }
  }
  if (data.blocked) localStorage.setItem('leveling_blocked', data.blocked);
  if (data.theme) localStorage.setItem('leveling_theme', data.theme);
  if (data.shop_items) {
    await storage.saveShopItems(JSON.parse(data.shop_items));
  }
  if (data.shop_categories) {
    await storage.saveShopCategories(JSON.parse(data.shop_categories));
  }
  if (data.purchased_items) {
    const items = JSON.parse(data.purchased_items);
    for (const itemId of items) {
      await storage.addPurchasedItem(itemId);
    }
  }
  if (data.purchase_history) {
    const history = JSON.parse(data.purchase_history);
    for (const purchase of history) {
      await storage.addPurchaseToHistory(purchase, purchase);
    }
  }
  if (data.completed_tasks) {
    await storage.saveCompletedTasks(JSON.parse(data.completed_tasks));
  }
  if (data.titles) {
    await storage.saveTitles(JSON.parse(data.titles));
  }
  if (data.earned_titles) {
    const titles = JSON.parse(data.earned_titles);
    for (const titleId of titles) {
      await storage.addEarnedTitle(titleId);
    }
  }
  if (data.selected_title) localStorage.setItem('leveling_selected_title', data.selected_title);
};

// Salvar progresso na nuvem
export const saveProgressToCloud = async (userId) => {
  const config = getSupabaseConfig();
  if (!config || !config.enabled) {
    throw new Error('Supabase não está habilitado. Configure e habilite o Supabase primeiro.');
  }
  
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase não configurado corretamente');
  }

  const localData = await getAllLocalData();
  const lastSave = getLastSave();

  const { data, error } = await supabase
    .from('user_saves')
    .upsert({
      user_id: userId,
      save_data: localData,
      last_modified: new Date().toISOString(),
      last_save: lastSave ? lastSave.toISOString() : null,
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  setLastSave();
  return data;
};

// Carregar progresso da nuvem
export const loadProgressFromCloud = async (userId) => {
  const config = getSupabaseConfig();
  if (!config || !config.enabled) {
    throw new Error('Supabase não está habilitado. Configure e habilite o Supabase primeiro.');
  }
  
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase não configurado corretamente');
  }

  const { data, error } = await supabase
    .from('user_saves')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum save encontrado
      return null;
    }
    throw error;
  }

  if (data && data.save_data) {
    await saveAllLocalData(data.save_data);
    setLastRestore();
    return {
      ...data,
      last_save: data.last_save ? new Date(data.last_save) : null,
      last_modified: data.last_modified ? new Date(data.last_modified) : null,
    };
  }

  return null;
};

// Verificar se há dessincronização
export const checkSyncStatus = async (userId) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_saves')
    .select('last_modified, last_save')
    .eq('user_id', userId)
    .single();

  // Se não há dados na nuvem, não há dessincronização
  if (error || !data) {
    return null;
  }

  const cloudLastModified = data.last_modified ? new Date(data.last_modified) : null;
  const cloudLastSave = data.last_save ? new Date(data.last_save) : null;
  const localLastSave = getLastSave();
  const localLastRestore = getLastRestore();

  // Se nunca salvou nem restaurou localmente, não há dessincronização
  if (!localLastSave && !localLastRestore) {
    return null;
  }

  // Se nunca restaurou, não há dessincronização (primeira vez usando)
  if (!localLastRestore) {
    return null;
  }

  // Se a nuvem tem uma modificação mais recente que a última restauração local
  if (cloudLastModified && localLastRestore) {
    if (cloudLastModified > localLastRestore) {
      // Nuvem tem dados mais recentes
      return {
        type: 'cloud_newer',
        cloudLastModified,
        cloudLastSave,
        localLastRestore,
      };
    }
  }

  // Se o local tem um save mais recente que a última modificação na nuvem
  if (localLastSave && cloudLastModified) {
    if (localLastSave > cloudLastModified) {
      // Local tem dados mais recentes
      return {
        type: 'local_newer',
        localLastSave,
        cloudLastModified,
        cloudLastSave,
      };
    }
  }

  return null;
};

