import * as Location from 'expo-location';
import React, { useContext, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { withTranslation } from 'react-i18next';

import { normalize, texts } from '../../config';
import { geoLocationToLocationObject } from '../../helpers';
import { useLocationSettings, useSystemPermission } from '../../hooks';
import { SettingsContext } from '../../SettingsProvider';
import { Button } from '../Button';
import { LoadingSpinner } from '../LoadingSpinner';
import { Map } from '../map';
import { SettingsToggle } from '../SettingsToggle';
import { RegularText } from '../Text';
import { Touchable } from '../Touchable';
import { Wrapper, WrapperHorizontal } from '../Wrapper';

export const baseLocationMarker = {
  iconName: 'ownLocation'
};

export const getLocationMarker = (locationObject) => ({
  iconName: locationObject?.iconName || baseLocationMarker.iconName,
  position: {
    ...locationObject.coords,
    latitude: locationObject?.coords?.latitude || locationObject?.coords?.lat,
    longitude: locationObject?.coords?.longitude || locationObject?.coords?.lng
  }
});

export const LocationSettingsComponent = ({ t }) => {
  const { globalSettings } = useContext(SettingsContext);
  const { settings = {} } = globalSettings || {};
  const { locationService: globalSettingsLocationService = {} } = settings;
  const { showAlternativeLocationButton = true } = globalSettingsLocationService;
  const { locationSettings, setAndSyncLocationSettings } = useLocationSettings();
  const systemPermission = useSystemPermission();

  const [showMap, setShowMap] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState();

  if (!systemPermission) {
    return <LoadingSpinner loading />;
  }

  const {
    locationService = systemPermission.status !== Location.PermissionStatus.DENIED,
    alternativePosition,
    defaultAlternativePosition
  } = locationSettings || {};

  const locationServiceSwitchData = {
    title: t('settingsTitles.locationService') || texts.settingsTitles.locationService,
    bottomDivider: true,
    topDivider: true,
    value: locationService,
    onActivate: (revert) => {
      Location.getForegroundPermissionsAsync().then((response) => {
        // if the system permission is granted, we can simply enable the sorting
        if (response.status === Location.PermissionStatus.GRANTED) {
          setAndSyncLocationSettings({ locationService: true });
          return;
        }

        // if we can ask for the system permission, do so and update the settings or revert depending on the outcome
        if (response.status === Location.PermissionStatus.UNDETERMINED || response.canAskAgain) {
          Location.requestForegroundPermissionsAsync()
            .then((response) => {
              if (response.status !== Location.PermissionStatus.GRANTED) {
                revert();
              } else {
                setAndSyncLocationSettings({ locationService: true });
                return;
              }
            })
            .catch(() => revert());
          return;
        }

        // if we neither have the permission, nor can we ask for it, then show an alert that the permission is missing
        revert();
        Alert.alert(
          t('settingsTitles.locationService') || texts.settingsTitles.locationService,
          t('settingsContents.locationService.onSystemPermissionMissing') || texts.settingsContents.locationService.onSystemPermissionMissing,
          [
            {
              text: t('settingsContents.locationService.cancel') || texts.settingsContents.locationService.cancel
            },
            {
              text: t('settingsContents.locationService.settings') || texts.settingsContents.locationService.settings,
              onPress: () => Linking.openSettings()
            }
          ]
        );
      });
    },
    onDeactivate: () => setAndSyncLocationSettings({ locationService: false })
  };

  let locations = [];

  if (selectedPosition) {
    locations = [{ ...baseLocationMarker, position: selectedPosition }];
  } else if (alternativePosition) {
    locations = [getLocationMarker(alternativePosition)];
  } else if (defaultAlternativePosition) {
    locations = [getLocationMarker(defaultAlternativePosition)];
  }

  return (
    <ScrollView>
      <WrapperHorizontal>
        <SettingsToggle item={locationServiceSwitchData} />
      </WrapperHorizontal>
      {!!showAlternativeLocationButton && (
        <>
          <Wrapper>
            <RegularText>
              {t('settingsContents.locationService.alternativePositionHint') || texts.settingsContents.locationService.alternativePositionHint}
            </RegularText>
          </Wrapper>

          <Collapsible style={styles.collapsible} collapsed={!showMap}>
            <Map
              locations={locations}
              onMapPress={({ nativeEvent }) => {
                setSelectedPosition({
                  ...nativeEvent.coordinate
                });
              }}
            />
            <Wrapper>
              <Button
                title={t('settingsContents.locationService.save') || texts.settingsContents.locationService.save}
                onPress={() => {
                  selectedPosition &&
                    setAndSyncLocationSettings({
                      alternativePosition: geoLocationToLocationObject(selectedPosition)
                    });
                  setSelectedPosition(undefined);
                  setShowMap(false);
                }}
              />

              <Touchable
                onPress={() => {
                  setSelectedPosition(undefined);
                  setShowMap(false);
                }}
                style={styles.containerStyle}
              >
                <RegularText primary center>
                  {t('settingsContents.locationService.abort') || texts.settingsContents.locationService.abort}
                </RegularText>
              </Touchable>
            </Wrapper>
          </Collapsible>
          <Collapsible collapsed={showMap}>
            <Wrapper>
              <Button
                title={t('settingsContents.locationService.chooseAlternateLocationButton') || texts.settingsContents.locationService.chooseAlternateLocationButton}
                onPress={() => setShowMap(true)}
              />
            </Wrapper>
          </Collapsible>
        </>
      )}
    </ScrollView>
  );
};

export const LocationSettings = withTranslation()(LocationSettingsComponent);
export default LocationSettings;

const styles = StyleSheet.create({
  collapsible: {
    flex: 1
  },
  containerStyle: {
    marginBottom: normalize(21)
  }
});
