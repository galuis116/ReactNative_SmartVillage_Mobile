import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, normalize } from '../config';
import { texts } from '../config/texts';

type Props = {
  route: any;
};

// Recursively search an object for a value and return the dotted key path when found.
function findKeyPath(obj: any, value: string, prefix = ''): string | null {
  if (!obj || typeof obj !== 'object') return null;

  for (const key of Object.keys(obj)) {
    const cur = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof cur === 'string') {
      if (cur === value) return path;
    } else if (typeof cur === 'object') {
      const found = findKeyPath(cur, value, path);
      if (found) return found;
    }
  }

  return null;
}

export const HeaderTranslatedTitle = ({ route }: Props) => {
  const { t } = useTranslation();

  const title = route?.params?.title;
  const titleKey = route?.params?.titleKey;
  const titleFallback = route?.params?.titleFallback;

  const text = useMemo(() => {
    if (titleKey) return t(titleKey);

    if (typeof title === 'string') {
      // If title already is a translation key (exists in i18n), prefer that.
      try {
        // t will return the key unchanged if missing; use that behavior to detect existence
        const translated = t(title);
        if (translated !== title) return translated;
      } catch (e) {
        // ignore
      }

      // Try to map a static string (texts.*) back to a translation key.
      const found = findKeyPath(texts.screenTitles, title, 'screenTitles');
      if (found) return t(found);

      // Nothing matched: use the provided string directly.
      return title;
    }

    if (titleFallback) return titleFallback;

    return '';
  }, [title, titleKey, titleFallback, t]);

  return (
    <View style={{ backgroundColor: 'transparent' }}>
      <Text
        numberOfLines={1}
        style={{
          color: colors.darkText,
          fontFamily: 'condbold',
          fontSize: normalize(18),
          lineHeight: normalize(23),
          backgroundColor: 'transparent'
        }}
      >
        {text}
      </Text>
    </View>
  );
};

export default HeaderTranslatedTitle;
