import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import de from './de.json';
import pl from './pl.json';

const resources = { en: { translation: en }, de: { translation: de }, pl: { translation: pl} };

export const initI18n = async () => {
  const storedLang = await AsyncStorage.getItem('APP_LANGUAGE');
  const deviceLang = Localization.locale.split('-')[0]; // e.g. "en"
  const language = storedLang || deviceLang || 'en';

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v3'
    });

  return i18n;
};

export default i18n;
