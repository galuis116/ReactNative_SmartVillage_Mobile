import PropTypes from 'prop-types';
import React, { createContext, useState } from 'react';

export const initialContext = {
  globalSettings: {
    filter: {},
    hdvt: {},
    navigation: 'tab',
    sections: {},
    settings: {
      pushNotifications: true,
      locationService: true,
      matomo: true,
      onboarding: true,
      wasteAddresses: {
        hasCalendar: true,
        hasExport: true,
        hasHeaderSearchBarOption: false,
        twoStep: false,
        texts: {
          hintStreet: 'Enter street name',
          hintCityAndStreet: 'Enter city and street',
          calendarIntro: 'Here are upcoming collection days',
          exportButton: 'Export schedule'
        }
      }
    },
    waste: {
      streetId: 'street-12345',
    // optional: keys must match the type keys returned by the waste types hook
      selectedTypeKeys: ['paper', 'organic', 'residual']
    },
    whistleblow: {},
    widgets: []
  },
  listTypesSettings: {},
  locationSettings: {},
  conversationSettings: {}
};

export const SettingsContext = createContext(initialContext);

export const SettingsProvider = ({
  initialGlobalSettings,
  initialListTypesSettings,
  initialLocationSettings,
  initialConversationSettings,
  children
}) => {
  const [globalSettings, setGlobalSettings] = useState(initialGlobalSettings);
  const [listTypesSettings, setListTypesSettings] = useState(initialListTypesSettings);
  const [locationSettings, setLocationSettings] = useState(initialLocationSettings);
  const [conversationSettings, setConversationSettings] = useState(initialConversationSettings);

  return (
    <SettingsContext.Provider
      value={{
        globalSettings,
        setGlobalSettings,
        listTypesSettings,
        setListTypesSettings,
        locationSettings,
        setLocationSettings,
        conversationSettings,
        setConversationSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

SettingsProvider.propTypes = {
  initialGlobalSettings: PropTypes.object.isRequired,
  initialListTypesSettings: PropTypes.object.isRequired,
  initialLocationSettings: PropTypes.object.isRequired,
  initialConversationSettings: PropTypes.object.isRequired,
  children: PropTypes.object.isRequired
};
