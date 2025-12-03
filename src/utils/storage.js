// Sistema de armazenamento local
const STORAGE_KEYS = {
  PLAYER_DATA: 'leveling_player_data',
  TASKS: 'leveling_tasks',
  NOTIFICATIONS: 'leveling_notifications',
  BLOCKED: 'leveling_blocked',
  THEME: 'leveling_theme',
  SPOTIFY_PLAYLISTS: 'leveling_spotify_playlists',
};

export const getPlayerData = () => {
  const data = localStorage.getItem(STORAGE_KEYS.PLAYER_DATA);
  if (data) {
    return JSON.parse(data);
  }
  return {
    level: 1,
    xp: 0,
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

// Gerenciamento de playlists do Spotify
export const getSpotifyPlaylists = () => {
  const data = localStorage.getItem(STORAGE_KEYS.SPOTIFY_PLAYLISTS);
  return data ? JSON.parse(data) : [];
};

export const saveSpotifyPlaylists = (playlists) => {
  localStorage.setItem(STORAGE_KEYS.SPOTIFY_PLAYLISTS, JSON.stringify(playlists));
};

export const addSpotifyPlaylist = (url) => {
  const playlists = getSpotifyPlaylists();
  if (!playlists.includes(url)) {
    playlists.push(url);
    saveSpotifyPlaylists(playlists);
  }
};

export const removeSpotifyPlaylist = (url) => {
  const playlists = getSpotifyPlaylists();
  const filtered = playlists.filter(p => p !== url);
  saveSpotifyPlaylists(filtered);
};

