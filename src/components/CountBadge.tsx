import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import COLORS from '../constants/colors';
import {useCartCount, useWishlistCount} from '../store/shopStore';

export function CartCountBadge() {
  const count = useCartCount();
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

export function WishlistCountBadge() {
  const count = useWishlistCount();
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    zIndex: 2,
  },
  text: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
  },
});
