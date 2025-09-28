import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';

import { colors, device, texts } from '../config';
import { parseColorToHex } from '../helpers/colorHelper';
import { addToStore, readFromStore } from '../helpers/storageHelper';

import { handleIncomingToken, PushNotificationStorageKeys } from './TokenHandling';

const PermissionStatus = {
  DENIED: 'denied',
  GRANTED: 'granted',
  UNDETERMINED: 'undetermined'
};

export const getInAppPermission = async (): Promise<boolean> => {
  console.log('🔔 getInAppPermission called');
  const result = (await readFromStore(PushNotificationStorageKeys.IN_APP_PERMISSION)) ?? false;
  console.log('🔔 getInAppPermission result:', result);
  return result;
};

export const setInAppPermission = async (newValue: boolean) => {
  console.log('🔔 setInAppPermission called with:', newValue);
  let token = undefined;
  const oldValue = await readFromStore(PushNotificationStorageKeys.IN_APP_PERMISSION);
  console.log(' setInAppPermission - old value:', oldValue);

  if (newValue !== oldValue) {
    console.log(' Permission value changed, processing...');
    if (newValue) {
      console.log('🔔 Enabling push notifications, getting token...');
      // receive token
      token = await registerForPushNotificationsAsync();
      console.log('🔔 Token received in setInAppPermission:', token);
    } else {
      console.log('🔔 Disabling push notifications');
    }

    console.log('🔔 Storing permission in local storage...');
    addToStore(PushNotificationStorageKeys.IN_APP_PERMISSION, newValue);

    // add token to store and notify server or
    // remove token from store and notify server
    console.log('🔔 Handling incoming token...');
    const successfullyHandled = await handleIncomingToken(token);
    console.log('🔔 Token handling result:', successfullyHandled);

    return successfullyHandled;
  }

  console.log('🔔 Permission value unchanged, returning true');
  return true;
};

// https://docs.expo.dev/versions/latest/sdk/notifications/#expopushtokenoptions
const registerForPushNotificationsAsync = async () => {
  console.log('🔔 registerForPushNotificationsAsync called');
  console.log(' Constants.expoConfig:', Constants.expoConfig);
  console.log('🔔 Project ID:', Constants.expoConfig?.extra?.eas.projectId);
  
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas.projectId
    });

    console.log('🔔 Generated Push Token:', token);
    console.log('🔔 Token type:', typeof token);
    console.log(' Token length:', token?.length);

    return token;
  } catch (error) {
    console.error('🔔 Error getting push token:', error);
    throw error;
  }
};

export const handleSystemPermissions = async (
  shouldSetInAppPermission = true
): Promise<boolean> => {
  console.log(' handleSystemPermissions called with shouldSetInAppPermission:', shouldSetInAppPermission);
  console.log('🔔 Device.isDevice:', Device.isDevice);
  console.log('🔔 Device.platform:', Device.platform);
  console.log('🔔 device.platform (from config):', device.platform);
  
  // Push notifications do not work properly with simulators/emulators
  // if (!Device.isDevice) {
  //   return false;
  // }

  console.log('🔔 Setting up Android notification channel...');
  if (device.platform === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: parseColorToHex(colors.primary) ?? '#ffffff'
      });
      console.log('🔔 Android notification channel set up successfully');
    } catch (error) {
      console.error(' Error setting up Android notification channel:', error);
    }
  }

  console.log('🔔 Getting existing permissions...');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('🔔 Existing permission status:', existingStatus);
  
  let finalStatus = existingStatus;
  const inAppPermission = await readFromStore(PushNotificationStorageKeys.IN_APP_PERMISSION);
  console.log(' In-app permission from store:', inAppPermission);
  
  // if in app permission is already set, do not request again
  const hasInAppPermissionSet = inAppPermission !== undefined && inAppPermission !== null;
  console.log('🔔 Has in-app permission set:', hasInAppPermissionSet);

  if (!hasInAppPermissionSet && existingStatus !== PermissionStatus.GRANTED) {
    console.log('🔔 Requesting system permissions...');
    try {
      const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
      console.log(' Requested permission status:', requestedStatus);
      finalStatus = requestedStatus;
    } catch (error) {
      console.error(' Error requesting permissions:', error);
    }
  } else {
    console.log('🔔 Skipping permission request - already set or granted');
  }

  const isGranted = finalStatus === PermissionStatus.GRANTED;
  console.log('🔔 Final permission granted:', isGranted);

  if (shouldSetInAppPermission && inAppPermission == null) {
    console.log('🔔 Setting in-app permission...');
    try {
      const successfullyHandledInAppPermission = await setInAppPermission(isGranted);
      console.log('🔔 Successfully handled in-app permission:', successfullyHandledInAppPermission);
      return successfullyHandledInAppPermission && isGranted;
    } catch (error) {
      console.warn('🔔 Error handling in app permissions:', error);
      return false;
    }
  }

  console.log('🔔 Returning permission status:', isGranted);
  return isGranted;
};

export const updatePushToken = async () => {
  console.log('🔔 updatePushToken called');
  try {
    const hasPermission = await handleSystemPermissions(false);
    console.log('🔔 updatePushToken - hasPermission:', hasPermission);
    
    if (hasPermission) {
      console.log('🔔 Getting new push token...');
      const token = await registerForPushNotificationsAsync();
      console.log(' updatePushToken - new token:', token);
      console.log('🔔 Handling incoming token...');
      const result = await handleIncomingToken(token);
      console.log('🔔 updatePushToken - token handling result:', result);
      return result;
    } else {
      console.log('🔔 updatePushToken - no permission, skipping');
      return false;
    }
  } catch (error) {
    console.error('🔔 updatePushToken error:', error);
    return false;
  }
};

export const showSystemPermissionMissingDialog = () => {
  const { abort, permissionMissingBody, permissionMissingTitle, settings } =
    texts.pushNotifications;

  Alert.alert(permissionMissingTitle, permissionMissingBody, [
    {
      text: abort,
      style: 'cancel'
    },
    {
      text: settings,
      onPress: () => Linking.openSettings()
    }
  ]);
};

export const showPermissionRequiredAlert = (approveCallback: () => void) => {
  const { abort, approve, permissionMissingTitle, permissionRequiredBody } =
    texts.pushNotifications;

  Alert.alert(permissionMissingTitle, permissionRequiredBody, [
    {
      text: abort,
      style: 'cancel'
    },
    {
      text: approve,
      onPress: async () => {
        const hasPermission = await handleSystemPermissions(false);

        if (!hasPermission) {
          showSystemPermissionMissingDialog();
        } else {
          await setInAppPermission(true);
          approveCallback();
        }
      }
    }
  ]);
};
