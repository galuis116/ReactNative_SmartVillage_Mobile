import _upperFirst from 'lodash/upperFirst';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Badge, ListItem } from 'react-native-elements';

import { colors, consts, Icon, normalize } from '../config';

import { BoldText, RegularText } from './Text';
import { Touchable } from './Touchable';

class CategoryListItem extends React.PureComponent {
  render() {
    const { categoryTitles, index, item, navigation, noSubtitle = false, section, t } = this.props;
    // console.log('CategoryListItem props:', { categoryTitles, index, item, section, noSubtitle, navigation, });
    const {
      bottomDivider,
      iconName,
      params,
      pointsOfInterestTreeCount,
      routeName: name,
      subtitle,
      title,
      topDivider,
      toursTreeCount
    } = item;
    const { categoryTitlesPointsOfInterest } = categoryTitles;
    const count =
      section.title === categoryTitlesPointsOfInterest ? pointsOfInterestTreeCount : toursTreeCount;

    const SelectedIcon = iconName ? Icon[_upperFirst(iconName)] : undefined;
    console.log(`Rendering CategoryListItem: ${title} with count: ${count}`);
    return (
      <ListItem
        bottomDivider={
          bottomDivider !== undefined
            ? bottomDivider
            : item.toursTreeCount > 0
            ? index < section.data.length - 1 // do not show a bottomDivider after last entry
            : true
        }
        topDivider={topDivider !== undefined ? topDivider : false}
        containerStyle={styles.container}
        onPress={() => {
          const updatedParams = {
            ...params,
            titleKey: item.titleKey || params.titleKey,
            titleFallback: title
          };
          navigation.push(name, updatedParams);
        }}
        delayPressIn={0}
        Component={Touchable}
        accessibilityLabel={`(${item.titleKey ? t(item.titleKey) : title}) ${consts.a11yLabel.poiCount} ${count} ${consts.a11yLabel.button}`}
      >
        {!!SelectedIcon && <SelectedIcon color={colors.darkText} />}

        <ListItem.Content>
          {noSubtitle || !subtitle ? null : <RegularText small>{subtitle}</RegularText>}
          <BoldText noSubtitle={noSubtitle}>{item.titleKey ? t(item.titleKey) : title}</BoldText>
        </ListItem.Content>

        <Badge value={count} badgeStyle={styles.badge} textStyle={styles.badgeText} />

        <Icon.ArrowRight color={colors.darkText} size={normalize(18)} />
      </ListItem>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.transparent,
    paddingHorizontal: 0,
    paddingVertical: normalize(15.8)
  },
  badge: {
    backgroundColor: colors.transparent,
    borderWidth: 0,
    flex: 1
  },
  badgeText: {
    color: colors.darkText,
    fontSize: normalize(14),
    fontFamily: 'bold',
    lineHeight: normalize(20)
  }
});

CategoryListItem.propTypes = {
  categoryTitles: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  item: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
  noSubtitle: PropTypes.bool,
  section: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired
};

export default withTranslation()(CategoryListItem);
