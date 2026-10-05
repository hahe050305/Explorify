import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import {clearCart} from '../store/shopStore';

const ORDER_TICK = require('../images/order_tick.jpg');

export default function OrderPlacedScreen({navigation, route}: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  // Animated values for individual customization
  const animTick = useRef(new Animated.Value(0)).current;
  const animTitle = useRef(new Animated.Value(0)).current;
  const animSubtitle = useRef(new Animated.Value(0)).current;
  const animOrderId = useRef(new Animated.Value(0)).current;

  const {
    items = [],
    subtotal = 0,
    shipping = 0,
    total = 0,
    orderId = '',
    orderDate = '',
    paymentId = '',
    paymentMethod = 'Razorpay (Online)',
  } = route?.params ?? {};

  // 1. Initial Loader Timer (1 second delay before screen elements begin)
  useEffect(() => {
    const loaderTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(loaderTimer);
  }, []);

  // 2. Separate useEffect for GPay-style green tick circle & image
  useEffect(() => {
    if (!loading) {
      Animated.timing(animTick, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, animTick]);

  // 3. Separate useEffect for "Order Placed !" title
  useEffect(() => {
    if (!loading) {
      Animated.timing(animTitle, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, animTitle]);

  // 4. Separate useEffect for "Your order has been placed Successfully" subtitle
  useEffect(() => {
    if (!loading) {
      Animated.timing(animSubtitle, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, animSubtitle]);

  // 5. Separate useEffect for Order ID pill
  useEffect(() => {
    if (!loading) {
      Animated.timing(animOrderId, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, animOrderId]);

  const createAnimatedStyle = (animValue: Animated.Value) => ({
    opacity: animValue,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });

  return (
    <View style={[styles.container, {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <StatusBar
        barStyle="dark-content"
        {...(Platform.OS === 'android' ? {backgroundColor: COLORS.bg, translucent: false} : {})}
      />

      {!loading ? (
        <View style={styles.content}>
          {/* 1. GPay-style green tick circle */}
          <Animated.View style={[styles.tickCircle, createAnimatedStyle(animTick)]}>
            <Image source={ORDER_TICK} style={styles.tickImage} resizeMode="contain" />
          </Animated.View>

          {/* 2. "Order Placed !" title */}
          <Animated.Text style={[styles.caption, createAnimatedStyle(animTitle)]}>
            Order Placed !
          </Animated.Text>

          {/* 3. "Your order has been placed Successfully" subtitle */}
          <Animated.Text style={[styles.subCaption, createAnimatedStyle(animSubtitle)]}>
            Your order has been placed Successfully
          </Animated.Text>

          {/* 4. Order ID pill */}
          {orderId ? (
            <Animated.View style={[styles.orderIdPill, createAnimatedStyle(animOrderId)]}>
              <Text style={styles.orderIdLabel}>Order ID</Text>
              <Text style={styles.orderIdValue}>#{orderId}</Text>
            </Animated.View>
          ) : null}

          {/* 5. "View Order Summary" button (renders without delay) */}
          <View style={styles.btnWrapper}>
            <TouchableOpacity
              style={styles.summaryBtn}
              activeOpacity={0.88}
              onPress={() =>
                navigation.navigate('OrderSummary', {
                  items,
                  subtotal,
                  shipping,
                  total,
                  orderId,
                  orderDate,
                  paymentId,
                  paymentMethod,
                })
              }
              delayPressIn={0}>
              <Text style={styles.summaryBtnText}>View Order Summary</Text>
            </TouchableOpacity>
          </View>

          {/* 6. "Continue Shopping" button (renders without delay) */}
          <View style={styles.btnWrapper}>
            <TouchableOpacity
              style={styles.continueBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Home')}
              delayPressIn={0}>
              <Text style={styles.continueBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>

          {/* 7. "Re-Order" button (renders without delay) */}
          
        </View>
      ) : (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.success} />
          <Text style={styles.loaderText}>Processing your order...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  tickCircle: {
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  tickImage: {
    width: 200,
    height: 200,
  },
  caption: {
    fontSize: 30,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    //fontFamily: 'Inter-Regular',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subCaption: {
    fontSize: 18,
    color: 'green',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    //fontFamily: 'Inter-Regular',
  },
  orderIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 24,
  },
  orderIdLabel: {
    fontSize: 15,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
  },
  orderIdValue: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
  },
  btnWrapper: {
    alignItems: 'center',
  },
  summaryBtn: {
    width: 150,
    backgroundColor: 'black',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryBtnText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    fontSize: 15,
    textAlign: 'center',
  },
  continueBtn: {
    width: 170,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueBtnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    fontSize: 15,
  },
  reorderBtn: {
    width: 170,
    backgroundColor: 'black',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  reorderBtnText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    fontSize: 15,
  },
  loaderWrap: {
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.subtext,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
});
