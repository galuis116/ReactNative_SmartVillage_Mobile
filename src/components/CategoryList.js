import _filter from 'lodash/filter';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { ActivityIndicator, SectionList, StyleSheet } from 'react-native';

import { colors, normalize, texts } from '../config';

import CategoryListItem from './CategoryListItem';
import { LoadingContainer } from './LoadingContainer';
import { SectionHeader } from './SectionHeader';

class CategoryListComponent extends React.PureComponent {
  keyExtractor = (item, index) => `index${index}-id${item.id}`;

  renderSectionHeader = ({ section: { title, data } }) => {
    const { hasSectionHeader = true } = this.props;

    if (!title || !data?.length || !hasSectionHeader) return null;

    return <SectionHeader title={title} containerStyle={styles.sectionHeaderContainer} />;
  };

  render() {
    const {
      categoryTitles = {},
      data,
      ListFooterComponent,
      ListHeaderComponent,
      navigation,
      noSubtitle = false,
      queryVariables,
      refreshControl
    } = this.props;
    const { t } = this.props;

    const categoryTitlesPointsOfInterest =
      (categoryTitles && categoryTitles.categoryTitlesPointsOfInterestKey)
        ? t(categoryTitles.categoryTitlesPointsOfInterestKey)
        : (categoryTitles && categoryTitles.categoryTitlesPointsOfInterest) ?? t('categoryTitles.places');

    const categoryTitlesTours =
      (categoryTitles && categoryTitles.categoryTitlesToursKey)
        ? t(categoryTitles.categoryTitlesToursKey)
        : (categoryTitles && categoryTitles.categoryTitlesTours) ?? t('categoryTitles.tours');

    if (!data?.length) {
      return (
        <LoadingContainer>
          <ActivityIndicator color={colors.refreshControl} />
        </LoadingContainer>
      );
    }

    // Sorting data alphabetically
    const sortedData = [...data].sort((a, b) => a.title.localeCompare(b.title));

    const sectionedData = [
      {
        title: categoryTitlesPointsOfInterest,
        data: _filter(
          sortedData,
          (category) =>
            !!category.pointsOfInterestTreeCount && (!category.parent || queryVariables.ids)
        )
      },
      {
        title: categoryTitlesTours,
        data: _filter(
          sortedData,
          (category) => !!category.toursTreeCount && (!category.parent || queryVariables.ids)
        )
      }
    ];

    return (
      <SectionList
        contentContainerStyle={styles.contentContainer}
        keyExtractor={this.keyExtractor}
        ListFooterComponent={ListFooterComponent}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={refreshControl}
        renderItem={({ item, index, section }) => (
          <CategoryListItem
            categoryTitles={{ categoryTitlesPointsOfInterest, categoryTitlesTours }}
            index={index}
            item={item}
            navigation={navigation}
            noSubtitle={noSubtitle}
            section={section}
          />
        )}
        renderSectionHeader={this.renderSectionHeader}
        sections={sectionedData}
        stickySectionHeadersEnabled
      />
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: normalize(16)
  },
  sectionHeaderContainer: {
    paddingLeft: 0,
    paddingRight: 0
  }
});

CategoryListComponent.propTypes = {
  categoryTitles: PropTypes.object,
  data: PropTypes.array,
  hasSectionHeader: PropTypes.bool,
  ListFooterComponent: PropTypes.object,
  ListHeaderComponent: PropTypes.object,
  navigation: PropTypes.object.isRequired,
  noSubtitle: PropTypes.bool,
  queryVariables: PropTypes.object,
  refreshControl: PropTypes.object,
  // from withTranslation HOC
  t: PropTypes.func
};

// Export a wrapped component as both named and default so callers using
// either `import { CategoryList }` or `import CategoryList from ...` get
// the translation-enabled component (prevents `t is not a function`).
export const CategoryList = withTranslation()(CategoryListComponent);
export default CategoryList;
