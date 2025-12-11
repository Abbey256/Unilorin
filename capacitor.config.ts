import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.unilorin.attendance',
    appName: 'UniAttend',
    webDir: 'dist/public',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        Geolocation: {
            permissions: ['location']
        }
    }
};

export default config;
