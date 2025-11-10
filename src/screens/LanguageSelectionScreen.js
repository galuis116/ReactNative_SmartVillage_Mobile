import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pl', label: 'Polski' },
  // Add unlimited languages here...
];

export default function LanguageSelectionScreen({ navigation }) {
  const { t } = useTranslation();
  const [selectedCode, setSelectedCode] = useState(i18n.language);

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await AsyncStorage.getItem('APP_LANGUAGE');
      if (savedLang) setSelectedCode(savedLang);
    };
    loadLanguage();
  }, []);

  // Keep the header title in sync with the current translation.
  // When the language changes, `t` will update and we set the navigation
  // options so the top screen title updates immediately (no app reload).
  useLayoutEffect(() => {
    navigation.setOptions({ title: t('choose_language') });
  }, [i18n.language, t, navigation]);

  const changeLanguage = async (code) => {
    setSelectedCode(code);
    await AsyncStorage.setItem('APP_LANGUAGE', code);
    await i18n.changeLanguage(code);
    navigation.goBack();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
      }}
      onPress={() => changeLanguage(item.code)}
    >
      {/* Radio button */}
      <View
        style={{
          height: 22,
          width: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: '#333',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 15,
        }}
      >
        {selectedCode === item.code && (
          <View
            style={{
              height: 12,
              width: 12,
              borderRadius: 6,
              backgroundColor: '#333',
            }}
          />
        )}
      </View>

      <Text style={{ fontSize: 18 }}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ padding: 20, flex: 1 }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>
        {t('choose_language')}
      </Text>

      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
      />
    </View>
  );
}
