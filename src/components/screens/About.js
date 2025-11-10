import PropTypes from 'prop-types';
import React, { useContext, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet } from 'react-native';

import { colors, normalize, texts } from '../../config';
import { useHomeRefresh, useRenderItem, useStaticContent } from '../../hooks';
import { NetworkContext } from '../../NetworkProvider';
import { QUERY_TYPES } from '../../queries';
import { SettingsContext } from '../../SettingsProvider';
import { LoadingContainer } from '../LoadingContainer';
import { SectionHeader } from '../SectionHeader';
import { VersionNumber } from '../VersionNumber';

const AboutComponent = ({ navigation, publicJsonFile = 'about', withHomeRefresh, withSettings, t }) => {
  const { data, loading, refetch } = useStaticContent({
    name: publicJsonFile,
    type: 'json',
    refreshTimeKey: `publicJsonFile-${publicJsonFile}`
  });
  const { isConnected } = useContext(NetworkContext);
  const { globalSettings } = useContext(SettingsContext);
  const [refreshing, setRefreshing] = useState(false);

  useHomeRefresh(withHomeRefresh ? refetch : undefined);

  const refresh = async (refetch) => {
    if (withHomeRefresh) return;

    setRefreshing(true);
    isConnected && (await refetch());
    setRefreshing(false);
  };

  const renderItem = useRenderItem(QUERY_TYPES.PUBLIC_JSON_FILE, navigation);

  if (loading)
    return withHomeRefresh ? null : (
      <LoadingContainer>
        <ActivityIndicator color={colors.refreshControl} />
      </LoadingContainer>
    );

  if (!data?.length) return <VersionNumber />;

  data.forEach((item) => (item.isHeadlineTitle = false));

  const { sections = {} } = globalSettings;
  const { headlineAboutKey, headlineAbout = texts.homeTitles.about } = sections;
  const aboutTitle = headlineAboutKey ? t(headlineAboutKey) : t('homeTitles.about');

  // Add Settings route if needed
  if (withSettings && !data.find((item) => item.routeName === 'Settings')) {
    data.push({
      bottomDivider: true,
      isHeadlineTitle: false,
      routeName: 'Settings',
      title: texts.screenTitles.appSettings
    });
  }

  // Helper to translate item titles
  const translateItemTitle = (item) => {
    switch (item.routeName) {
      case 'Settings':
        return t('screenTitles.appSettings');
      case 'LanguageSelection':
        return t('screenTitles.languageSettings');
      default:
        return item.title;
    }
  };

  // Apply translation to each item
  const translatedData = data.map((item) => ({
    ...item,
    title: translateItemTitle(item),
  }));

  const sectionData = [
    {
      title: aboutTitle,
      data: translatedData
    }
  ];

  return (
    <SectionList
      initialNumToRender={100}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => refresh(refetch)}
          colors={[colors.refreshControl]}
          tintColor={colors.refreshControl}
        />
      }
      sections={sectionData}
      renderSectionHeader={({ section: { title } }) =>
        !!title && <SectionHeader title={title} containerStyle={styles.sectionHeader} />
      }
      renderItem={renderItem}
      keyExtractor={(item) => item.title}
      ListFooterComponent={<VersionNumber />}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: normalize(16)
  },
  sectionHeader: {
    paddingLeft: 0,
    paddingRight: 0
  }
});

AboutComponent.propTypes = {
  navigation: PropTypes.object.isRequired,
  sectionData: PropTypes.array,
  publicJsonFile: PropTypes.string,
  withHomeRefresh: PropTypes.bool,
  withSettings: PropTypes.bool,
  t: PropTypes.func.isRequired
};

// Export both named and default exports with translation wrapper
export const About = withTranslation()(AboutComponent);
export default About;
