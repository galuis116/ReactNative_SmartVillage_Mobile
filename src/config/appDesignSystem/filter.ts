import { consts } from '../consts';
import { QUERY_TYPES } from '../../queries'; // <- updated path

const { FILTER_TYPES } = consts;

export const eventResourceFiltersConfig = [
  {
    dataResourceType: QUERY_TYPES.EVENT_RECORDS,
    config: {
      active: { default: true }, // must be true to show filters
      category: {
        default: true,
        type: FILTER_TYPES.DROPDOWN,
        isMultiselect: true,
        searchable: true
      },
      dateStart: {
        default: true,
        type: FILTER_TYPES.DATE,
        hasPastDates: true,
        hasFutureDates: true
      },
      dateEnd: {
        default: true,
        type: FILTER_TYPES.DATE,
        hasPastDates: true,
        hasFutureDates: true
      },
      location: {
        default: true,
        type: FILTER_TYPES.DROPDOWN,
        isMultiselect: true,
        searchable: true
      },
      radiusSearch: {
        default: true,
        type: FILTER_TYPES.SLIDER,
        options: [5, 10, 15, 20, 25, 50, 100]
      },
      saveable: { default: true, type: FILTER_TYPES.CHECKBOX }
    }
  }
];
