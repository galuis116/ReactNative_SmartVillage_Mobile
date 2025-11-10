import { useNavigation } from '@react-navigation/native';
import React, { useContext } from 'react';
import { View } from 'react-native';

import { texts } from '../config';
import { ScreenName } from '../types';
import { getTitleForQuery } from '../helpers';
import { useHomeRefresh, useStaticContent } from '../hooks';
import { SettingsContext } from '../SettingsProvider';

import { Button } from './Button';
import { SectionHeader } from './SectionHeader';
import { Wrapper } from './Wrapper';

type TButton = {
  params?: any;
  routeName: ScreenName;
  title: string;
};

export const HomeButtons = ({ publicJsonFile }: { publicJsonFile: string }) => {
  const navigation = useNavigation();
  const nav: any = navigation;
  const { globalSettings } = useContext(SettingsContext);

  const { data, loading, refetch } = useStaticContent<TButton[]>({
    refreshTimeKey: `publicJsonFile-${publicJsonFile}`,
    name: publicJsonFile,
    type: 'json'
  });

  useHomeRefresh(refetch);

  if (loading || !data?.length) return null;

  const { sections = {} } = globalSettings;
  const { headlineButtons = texts.homeTitles.buttons } = sections;

  return (
    <View>
      <SectionHeader title={headlineButtons} />
      <Wrapper>
        {data?.map((item, index) => (
          <Button
            key={`${item.title}-${index}`}
            onPress={() => {
              const params = item.params || {};

              // If navigating to the Index screen, ensure a fresh route and a sensible title
              if (item.routeName === ScreenName.Index) {
                const title = params.title ?? getTitleForQuery(params.query);
                if (nav?.push) {
                  return nav.push(item.routeName, { ...params, title });
                }
                return nav.navigate(item.routeName, { ...params, title });
              }

              return nav.navigate(item.routeName, params);
            }}
            title={item.title}
          />
        ))}
      </Wrapper>
    </View>
  );
};
