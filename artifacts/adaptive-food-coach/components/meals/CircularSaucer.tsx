import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * Figma saucer: a perfect circle. overflow hidden so no food draws past the rim.
 */
export function CircularSaucer({
  source,
  size,
  testID,
  style,
}: {
  source: ImageSourcePropType;
  size: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      testID={testID}
      style={[
        styles.saucer,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Image source={source} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  saucer: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
});
