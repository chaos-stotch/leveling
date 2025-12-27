import { Capacitor } from '@capacitor/core';

// Abrir configurações de apps do Android
export const openAppSettings = async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    throw new Error('Disponível apenas no Android');
  }

  try {
    // Usar interface JavaScript do MainActivity
    if (window.AndroidSettings && window.AndroidSettings.openAppSettings) {
      window.AndroidSettings.openAppSettings();
    } else {
      // Fallback: usar App.openUrl
      const { App } = await import('@capacitor/app');
      await App.openUrl({ url: 'android-app://settings' });
    }
  } catch (error) {
    console.error('Erro ao abrir configurações:', error);
    throw error;
  }
};

