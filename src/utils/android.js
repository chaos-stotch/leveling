import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

// Register custom plugin
let AppList = null;
try {
  AppList = registerPlugin('AppList', {
    web: () => import('./android.web.js').then(m => new m.AppListWeb()),
  });
} catch (error) {
  // Plugin not available
}

// Get installed apps (Android only)
export const getInstalledApps = async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android' || !AppList) {
    return [];
  }

  try {
    const result = await AppList.getInstalledApps();
    return result.apps || [];
  } catch (error) {
    console.error('Error getting installed apps:', error);
    return [];
  }
};

// Launch an app by package name
export const launchApp = async (packageName) => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android' || !AppList) {
    return false;
  }

  try {
    await AppList.launchApp({ packageName });
    return true;
  } catch (error) {
    console.error('Error launching app:', error);
    return false;
  }
};

// Check if running on Android
export const isAndroid = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

