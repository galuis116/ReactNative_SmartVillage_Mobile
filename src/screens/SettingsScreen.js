import { isARSupportedOnDevice } from '@reactvision/react-viro';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, SectionList, StyleSheet } from 'react-native';

import {
  AugmentedReality,
  LoadingContainer,
  RegularText,
  SafeAreaViewFlex,
  SettingsToggle,
  TextListItem,
  Wrapper
} from '../components';
import {
  ListSettings,
  LocationSettings,
  MowasRegionSettings,
  PermanentFilterSettings
} from '../components/settings';
import { colors, consts, normalize, texts } from '../config';
import {
  addToStore,
  createMatomoUserId,
  matomoSettings,
  readFromStore,
  removeMatomoUserId
} from '../helpers';
import { useMatomoTrackScreenView } from '../hooks';
import {
  HAS_TERMS_AND_CONDITIONS_STORE_KEY,
  ONBOARDING_STORE_KEY,
  TERMS_AND_CONDITIONS_STORE_KEY
} from '../OnboardingManager';
import {
  handleSystemPermissions,
  PushNotificationStorageKeys,
  setInAppPermission,
  showSystemPermissionMissingDialog
} from '../pushNotifications';
import { SettingsContext } from '../SettingsProvider';
import { ScreenName } from '../types';

const { MATOMO_TRACKING } = consts;

const keyExtractor = (item, index) => `index${index}-item${item.title || item}`;

export const SETTINGS_SCREENS = {
  AR: 'augmentedRealitySettings',
  LIST: 'listSettings',
  LOCATION: 'locationSettings',
  MOWAS_REGION: 'mowasRegionSettings',
  PERMANENT_FILTER: 'permanentFilterSettings'
};

/* eslint-disable complexity */
const renderItem = ({ item, navigation, listsWithoutArrows, settingsScreenListItemTitles, t }) => {
  let component;
  const title = settingsScreenListItemTitles[item];

  if (item === SETTINGS_SCREENS.LOCATION) {
    component = (
      <TextListItem
        item={{
          isHeadlineTitle: false,
          params: { setting: item, title: title || t('settingsContents.locationService.setting') },
          routeName: ScreenName.Settings,
          title: title || t('settingsContents.locationService.setting'),
          topDivider: true
        }}
        listsWithoutArrows={listsWithoutArrows}
        navigation={navigation}
      />
    );
  } else if (item === SETTINGS_SCREENS.PERMANENT_FILTER) {
    component = (
      <TextListItem
        item={{
          isHeadlineTitle: false,
          params: { setting: item, title: title || t('settingsContents.permanentFilter.setting') },
          routeName: ScreenName.Settings,
          title: title || t('settingsContents.permanentFilter.setting')
        }}
        listsWithoutArrows={listsWithoutArrows}
        navigation={navigation}
      />
    );
  } else if (item === SETTINGS_SCREENS.MOWAS_REGION) {
    component = (
      <TextListItem
        item={{
          isHeadlineTitle: false,
          params: { setting: item, title: title || t('settingsContents.mowasRegion.setting') },
          routeName: ScreenName.Settings,
          title: title || t('settingsContents.mowasRegion.setting')
        }}
        listsWithoutArrows={listsWithoutArrows}
        navigation={navigation}
      />
    );
  } else if (item === SETTINGS_SCREENS.LIST) {
    component = (
      <TextListItem
        item={{
          isHeadlineTitle: false,
          params: { setting: item, title: title || t('settingsContents.list.setting') },
          routeName: ScreenName.Settings,
          title: title || t('settingsContents.list.setting')
        }}
        listsWithoutArrows={listsWithoutArrows}
        navigation={navigation}
      />
    );
  } else if (item === SETTINGS_SCREENS.AR) {
    component = (
      <TextListItem
        item={{
          isHeadlineTitle: false,
          params: { setting: item, title: title || t('settingsContents.ar.setting') },
          routeName: ScreenName.Settings,
          title: title || t('settingsContents.ar.setting')
        }}
        listsWithoutArrows={listsWithoutArrows}
        navigation={navigation}
      />
    );
  } else {
    component = <SettingsToggle item={item} />;
  }

  return component;
};
/* eslint-enable complexity */

renderItem.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  section: PropTypes.object.isRequired,
  orientation: PropTypes.string.isRequired,
  dimensions: PropTypes.object.isRequired
};

const onActivatePushNotifications = (revert) => {
  handleSystemPermissions(false)
    .then((hasPermission) => {
      if (!hasPermission) {
        showSystemPermissionMissingDialog();
        revert();
      } else {
        setInAppPermission(true)
          .then((success) => !success && revert())
          .catch((error) => {
            console.warn('An error occurred while activating push notifications:', error);
            revert();
          });
      }
    })
    .catch((error) => {
      console.warn(
        'An error occurred while handling system permissions for activating push notifications:',
        error
      );
    });
};

const onDeactivatePushNotifications = (revert) => {
  setInAppPermission(false)
    .then((success) => !success && revert())
    .catch((error) => {
      console.warn('An error occurred while deactivating push notifications:', error);
      revert();
    });
};

const SettingsScreenComponent = ({ navigation, route, t }) => {
  const { globalSettings } = useContext(SettingsContext);
  const { mowas, settings = {} } = globalSettings;
  const { listsWithoutArrows = false, settingsScreenListItemTitles = {} } = settings;
  const [data, setData] = useState([]);
  const { setting = '' } = route?.params || {};

  useMatomoTrackScreenView(MATOMO_TRACKING.SCREEN_VIEW.SETTINGS);

  useEffect(() => {
    /* eslint-disable complexity */
    const updateData = async () => {
      try {
        const settingsList = [];
        console.log('SettingsScreen.updateData: global settings =', globalSettings);

        // add push notification option if they are enabled
        if (settings.pushNotifications !== false) {
          const pushPermission = await readFromStore(PushNotificationStorageKeys.IN_APP_PERMISSION);

          settingsList.push({
            data: [
              {
                title: settingsScreenListItemTitles.pushNotifications || t('settingsTitles.pushNotifications'),
                topDivider: false,
                value: pushPermission,
                onActivate: onActivatePushNotifications,
                onDeactivate: onDeactivatePushNotifications
              }
            ]
          });
        }

        // settings should sometimes contain matomo analytics next, depending on server settings
        if (settings.matomo) {
          const { consent: matomoValue } = await matomoSettings();

          settingsList.push({
            data: [
              {
                title: settingsScreenListItemTitles.matomo || t('settingsTitles.analytics'),
                topDivider: true,
                value: matomoValue,
                onActivate: (revert) =>
                  Alert.alert(
                    t('settingsTitles.analytics'),
                    t('settingsContents.analytics.onActivate'),
                    [
                      {
                        text: t('settingsContents.analytics.no'),
                        onPress: revert,
                        style: 'cancel'
                      },
                      {
                        text: t('settingsContents.analytics.yes'),
                        onPress: createMatomoUserId
                      }
                    ],
                    { cancelable: false }
                  ),
                onDeactivate: (revert) =>
                  Alert.alert(
                    t('settingsTitles.analytics'),
                    t('settingsContents.analytics.onDeactivate'),
                    [
                      {
                        text: t('settingsContents.analytics.no'),
                        onPress: revert,
                        style: 'cancel'
                      },
                      {
                        text: t('settingsContents.analytics.yes'),
                        onPress: removeMatomoUserId
                      }
                    ],
                    { cancelable: false }
                  )
              }
            ]
          });
        }

        if (settings.onboarding) {
          const onboarding = await readFromStore(ONBOARDING_STORE_KEY);

          settingsList.push({
            data: [
              {
                title: settingsScreenListItemTitles.onboarding || t('settingsTitles.onboarding'),
                topDivider: true,
                value: onboarding === 'incomplete',
                onActivate: () =>
                  Alert.alert(
                    t('settingsTitles.onboarding'),
                    t('settingsContents.onboarding.onActivate'),
                    [
                      {
                        text: t('settingsContents.onboarding.ok'),
                        onPress: () => addToStore(ONBOARDING_STORE_KEY, 'incomplete')
                      }
                    ]
                  ),
                onDeactivate: () =>
                  Alert.alert(
                    t('settingsTitles.onboarding'),
                    t('settingsContents.onboarding.onDeactivate'),
                    [
                      {
                        text: t('settingsContents.onboarding.ok'),
                        onPress: () => addToStore(ONBOARDING_STORE_KEY, 'complete')
                      }
                    ]
                  )
              }
            ]
          });
        }

        const termsAndConditionsAccepted = await readFromStore(TERMS_AND_CONDITIONS_STORE_KEY);
        const hasTermsAndConditionsSection = await readFromStore(HAS_TERMS_AND_CONDITIONS_STORE_KEY);

        if (
          !!hasTermsAndConditionsSection &&
          termsAndConditionsAccepted != null &&
          termsAndConditionsAccepted != 'unknown'
        ) {
          settingsList.push({
            data: [
              {
                title: settingsScreenListItemTitles.termsAndConditions || t('settingsTitles.termsAndConditions'),
                topDivider: true,
                value: termsAndConditionsAccepted === 'accepted',
                onActivate: () => null,
                onDeactivate: (revert) =>
                  Alert.alert(
                    t('profile.termsAndConditionsAlertTitle'),
                    t('settingsContents.termsAndConditions.onDeactivate'),
                    [
                      {
                        text: t('settingsContents.termsAndConditions.abort'),
                        onPress: revert,
                        style: 'cancel'
                      },
                      {
                        text: t('settingsContents.termsAndConditions.ok'),
                        onPress: () => addToStore(TERMS_AND_CONDITIONS_STORE_KEY, 'declined'),
                        style: 'destructive'
                      }
                    ],
                    { cancelable: false }
                  )
              }
            ]
          });
        }

        if (settings.locationService) {
          settingsList.push({
            data: [SETTINGS_SCREENS.LOCATION]
          });
        }

        settingsList.push({
          data: [SETTINGS_SCREENS.PERMANENT_FILTER]
        });

        if (mowas?.regionalKeys?.length) {
          settingsList.push({
            data: [SETTINGS_SCREENS.MOWAS_REGION]
          });
        }

        // settingsList.push({
        //   data: [SETTINGS_SCREENS.LIST]
        // });

        if (settings.ar?.tourId) {
          try {
            const isARSupported = (await isARSupportedOnDevice())?.isARSupported;

            if (isARSupported) {
              settingsList.push({
                data: [SETTINGS_SCREENS.AR]
              });
            }
          } catch (error) {
            // if Viro is not integrated, we need to catch the error for `isARSupportedOnDevice of null`
            console.error(error);
          }
        }

        // safety: if nothing was added, provide a minimal default so the screen renders
        if (!settingsList.length) {
          console.warn('SettingsScreen.updateData: no settings entries were generated, adding fallback');
          settingsList.push({ data: [SETTINGS_SCREENS.PERMANENT_FILTER] });
        }

        setData(settingsList);
        console.log('SettingsScreen.updateData: settingsList length =', settingsList.length);
      } catch (err) {
        console.error('SettingsScreen.updateData error:', err);
        const fallback = [{ data: [SETTINGS_SCREENS.PERMANENT_FILTER] }];
        setData(fallback);
      }
    };
    /* eslint-enable complexity */

    setting == '' && updateData();
  }, [setting]);

  if (setting == '' && !data.length) {
    return (
      <LoadingContainer>
        <ActivityIndicator color={colors.refreshControl} />
      </LoadingContainer>
    );
  }

  // switch to have a condition on `setting` to decide which component to render
  let Component;

  switch (setting) {
    case SETTINGS_SCREENS.LOCATION:
      Component = <LocationSettings />;
      break;
    case SETTINGS_SCREENS.PERMANENT_FILTER:
      Component = <PermanentFilterSettings />;
      break;
    case SETTINGS_SCREENS.MOWAS_REGION:
      Component = <MowasRegionSettings mowasRegionalKeys={mowas?.regionalKeys} />;
      break;
    case SETTINGS_SCREENS.LIST:
      Component = <ListSettings />;
      break;
    case SETTINGS_SCREENS.AR:
      Component = <AugmentedReality id={settings.ar?.tourId} onSettingsScreen />;
      break;
    default:
      Component = (
        <SectionList
          initialNumToRender={100}
          keyExtractor={keyExtractor}
          sections={data}
          renderItem={({ item }) =>
            renderItem({
              item,
              navigation,
              listsWithoutArrows,
              settingsScreenListItemTitles,
              t
            })
          }
          ListHeaderComponent={
            !!t('settingsScreen.intro') && (
              <Wrapper>
                <RegularText>{t('settingsScreen.intro')}</RegularText>
              </Wrapper>
            )
          }
          style={styles.container}
        />
      );
      break;
  }

  return <SafeAreaViewFlex>{Component}</SafeAreaViewFlex>;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: normalize(16)
  }
});

SettingsScreenComponent.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
  // provided by withTranslation HOC
  t: PropTypes.func
};

const SettingsScreen = withTranslation()(SettingsScreenComponent);
// export wrapped component as both named and default so imports from `src/screens` get the
// translation-enabled component regardless of import style
export { SettingsScreen };
export default SettingsScreen;
