import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { MainApp } from './src';
import { auth } from './src/auth';
import { namespace, secrets } from './src/config';

// Initialize Sentry BEFORE wrapping the App component
const sentryApi = secrets[namespace]?.sentryApi;

if (sentryApi?.dsn) {
  Sentry.init({
    dsn: sentryApi.dsn,
    enabled: !__DEV__
  });
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const App = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // runs auth() if app returns from background or inactive to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        auth();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView>
      <MainApp />
    </GestureHandlerRootView>
  );
};

// Wrap with Sentry AFTER initialization
export default sentryApi?.dsn ? Sentry.wrap(App) : App;
