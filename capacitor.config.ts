import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.influflow.app',
  appName: 'Influgal',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '870217356718-n9imfdtdo6dcl4kno120m8qvv7q11o4h.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
