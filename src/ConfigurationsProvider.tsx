import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useQuery as useQueryWithApollo } from 'react-apollo';
import { useQuery } from 'react-query';

import { SettingsContext } from './SettingsProvider';
import {
  defaultAppDesignSystemConfig,
  eventResourceFiltersConfig
} from './config/appDesignSystem';
import { defaultSueAppConfig } from './config/sue';
import { storageHelper } from './helpers';
import { useHomeRefresh, useStaticContent } from './hooks';
import { QUERY_TYPES, getQuery } from './queries';
import { GenericType } from './types';

const FILTER_QUERY_TYPES = {
  'GenericItem::ConstructionSite': GenericType.ConstructionSite,
  'GenericItem::Deadline': GenericType.Deadline,
  'GenericItem::DefectReport': GenericType.DefectReport,
  'GenericItem::Job': GenericType.Job,
  'GenericItem::Noticeboard': GenericType.Noticeboard,
  'GenericItem::Offer': GenericType.Commercial,
  EventRecord: QUERY_TYPES.EVENT_RECORDS,
  NewsItem: QUERY_TYPES.NEWS_ITEMS,
  PointOfInterest: QUERY_TYPES.POINTS_OF_INTEREST,
  Tour: QUERY_TYPES.TOURS
};

const mergeDefaultConfiguration = (target, source) =>
  Object.entries(source).reduce(
    (acc, [key, value]) => {
      acc[key] =
        value instanceof Object && !Array.isArray(value)
          ? mergeDefaultConfiguration(acc[key] || {}, value)
          : value;
      return acc;
    },
    { ...target }
  );

const defaultConfiguration = {
  appDesignSystem: defaultAppDesignSystemConfig,
  refetch: () => {},
  isLoading: true,
  resourceFilters: eventResourceFiltersConfig,
  sueConfig: defaultSueAppConfig
};

export const ConfigurationsContext = createContext(defaultConfiguration);

export const ConfigurationsProvider = ({ children }: { children?: ReactNode }) => {
  const { globalSettings } = useContext(SettingsContext);
  const { settings, appDesignSystem = {} } = globalSettings;
  const { sue = {} } = settings || {};

  const [configurations, setConfigurations] = useState(defaultConfiguration);
  const [isLoading, setIsLoading] = useState(true);

  const { data: sueConfigData, refetch: refetchSueConfig } = useQuery(
    [QUERY_TYPES.SUE.CONFIGURATIONS],
    () => getQuery(QUERY_TYPES.SUE.CONFIGURATIONS)(),
    { enabled: !!Object.keys(sue).length }
  );

  const { data: sueProgress, refetch: refetchSueProgress } = useStaticContent({
    refreshTimeKey: 'publicJsonFile-sueReportProgress',
    name: 'sueReportProgress',
    type: 'json',
    skip: !Object.keys(sue).length
  });

  const { data: resourceFiltersData } = useQueryWithApollo(getQuery(QUERY_TYPES.RESOURCE_FILTERS), {
    fetchPolicy: 'network-only'
  });
console.log('resourceFiltersData', resourceFiltersData);
console.log('defaultResourceFiltersConfig', eventResourceFiltersConfig);
  const mergedConfig = useMemo(() => {
  const isSueConfigEmpty = !Object.keys(sue).length;
  const isResourceFiltersEmpty = !resourceFiltersData?.resourceFilters?.length;

  const resourceFilters = !isResourceFiltersEmpty
    ? resourceFiltersData.resourceFilters.map((resourceFilter: any) => ({
        ...resourceFilter,
        dataResourceType: FILTER_QUERY_TYPES[resourceFilter.dataResourceType]
      }))
    : eventResourceFiltersConfig

  if (isSueConfigEmpty && isResourceFiltersEmpty) {
    return defaultConfiguration;
  }

  return mergeDefaultConfiguration(defaultConfiguration, {
    appDesignSystem,
    resourceFilters,
    sueConfig: { ...sue, ...sueConfigData, sueProgress }
  });
}, [sueConfigData, sueProgress, resourceFiltersData]);
console.log('mergedConfig.resourceFilters', mergedConfig.resourceFilters);

  const reloadCallback = useCallback(async () => {
    setIsLoading(true);

    try {
      await refetchSueConfig();
      await refetchSueProgress();
    } catch (e) {
      console.warn(e);
    }
    setIsLoading(false);
  }, []);

  useHomeRefresh(reloadCallback);

  useEffect(() => {
    setIsLoading(true);

    setConfigurations(mergedConfig);
    storageHelper.setConfigurations(mergedConfig);

    setIsLoading(false);
  }, [mergedConfig]);

  return (
    <ConfigurationsContext.Provider
      value={{ ...configurations, refetch: reloadCallback, isLoading }}
    >
      {children}
    </ConfigurationsContext.Provider>
  );
};
