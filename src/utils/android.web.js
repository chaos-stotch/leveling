// Web implementation for AppList plugin
export class AppListWeb {
  async getInstalledApps() {
    return { apps: [] };
  }

  async launchApp() {
    throw new Error('Not available on web platform');
  }
}

