import React, { useContext } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { withTranslation } from 'react-i18next';

import appJson from '../../app.json';
import { AccessibilityContext } from '../AccessibilityProvider';
import { colors, consts, device } from '../config';
import { SettingsContext } from '../SettingsProvider';

import { RegularText } from './Text.js';
import { Touchable } from './Touchable';
import { WrapperVertical } from './Wrapper.js';

const { a11yLabel } = consts;

export const VersionNumberComponent = ({ t }) => {
  const { isReduceTransparencyEnabled } = useContext(AccessibilityContext);
  const { globalSettings } = useContext(SettingsContext);
  const { settings = {} } = globalSettings;
  const { search } = settings;
  const buildNumber =
    device.platform === 'ios' ? appJson.expo.ios.buildNumber : appJson.expo.android.versionCode;

  const versionTitle = t('version.versionInfos') || a11yLabel.versionInfos;
  const appVersionLabel = t('version.appVersion') || a11yLabel.appVersion;

  return (
    <WrapperVertical>
      <Touchable
        activeOpacity={0.8}
        onPress={() => {
          Alert.alert(
            versionTitle,
            [
              `Smart Village App: ${appJson.expo.version}`,
              `Build: ${buildNumber}`,
              `OTA: ${appJson.expo.otaVersion}`,
              search ? `Suche: ${appJson.expo.searchVersion}` : undefined
            ]
              .filter(Boolean)
              .join('\n')
          );
        }}
      >
        <RegularText
          center
          smallest
          lighter
          style={[isReduceTransparencyEnabled && styles.accessibilityColor]}
          accessibilityLabel={`${appVersionLabel} ${appJson.expo.version} ${a11yLabel.button}`}
        >
          {versionTitle}
        </RegularText>
      </Touchable>
    </WrapperVertical>
  );
};

export const VersionNumber = withTranslation()(VersionNumberComponent);
export default VersionNumber;

const styles = StyleSheet.create({
  accessibilityColor: {
    color: colors.darkText
  }
});
