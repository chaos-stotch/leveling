import { createClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'leveling_supabase_config';
const LAST_SAVE_KEY = 'leveling_last_save';
const LAST_RESTORE_KEY = 'leveling_last_restore';

// Obter configuração do Supabase
export const getSupabaseConfig = () => {
  const config = localStorage.getItem(SUPABASE_CONFIG_KEY);
  return config ? JSON.parse(config) : null;
};

// Salvar configuração do Supabase
export const saveSupabaseConfig = (config) => {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
};

// Criar cliente Supabase
export const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config || !config.url || !config.anonKey) {
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
export const getAllLocalData = () => {
  return {
    player_data: localStorage.getItem('leveling_player_data'),
    tasks: localStorage.getItem('leveling_tasks'),
    notifications: localStorage.getItem('leveling_notifications'),
    blocked: localStorage.getItem('leveling_blocked'),
    theme: localStorage.getItem('leveling_theme'),
    shop_items: localStorage.getItem('leveling_shop_items'),
    shop_categories: localStorage.getItem('leveling_shop_categories'),
    purchased_items: localStorage.getItem('leveling_purchased_items'),
    purchase_history: localStorage.getItem('leveling_purchase_history'),
    completed_tasks: localStorage.getItem('leveling_completed_tasks'),
  };
};

// Salvar todos os dados locais
export const saveAllLocalData = (data) => {
  if (data.player_data) localStorage.setItem('leveling_player_data', data.player_data);
  if (data.tasks) localStorage.setItem('leveling_tasks', data.tasks);
  if (data.notifications) localStorage.setItem('leveling_notifications', data.notifications);
  if (data.blocked) localStorage.setItem('leveling_blocked', data.blocked);
  if (data.theme) localStorage.setItem('leveling_theme', data.theme);
  if (data.shop_items) localStorage.setItem('leveling_shop_items', data.shop_items);
  if (data.shop_categories) localStorage.setItem('leveling_shop_categories', data.shop_categories);
  if (data.purchased_items) localStorage.setItem('leveling_purchased_items', data.purchased_items);
  if (data.purchase_history) localStorage.setItem('leveling_purchase_history', data.purchase_history);
  if (data.completed_tasks) localStorage.setItem('leveling_completed_tasks', data.completed_tasks);
};

// Salvar progresso na nuvem
export const saveProgressToCloud = async (userId) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase não configurado');
  }

  const localData = getAllLocalData();
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
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase não configurado');
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
    saveAllLocalData(data.save_data);
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

