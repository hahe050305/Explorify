import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useLocation } from '../context/LocationContext';
import COLORS from '../constants/colors';

export default function OrderSummaryScreen({navigation, route}: any) {
  const insets = useSafeAreaInsets();
  const { location } = useLocation();

  const {
    subtotal = 0,
    shipping = 0,
    total = 0,
    orderId = '',
    orderDate = '',
    items = [],
    paymentId = '',
    paymentMethod = 'Razorpay (Online)',
  } = route?.params ?? {};

  const discount = subtotal * 0.35;
  const mrpTotal = subtotal * 1.35;
  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <StatusBar
        barStyle="dark-content"
        {...(Platform.OS === 'android' ? {backgroundColor: COLORS.card, translucent: false} : {})}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
          delayPressIn={0}>
          <Image
            source={require('../images/icon-back.jpg')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Summary</Text>
          {orderId ? <Text style={styles.headerSub}>#{orderId}</Text> : null}
        </View>
        <View style={{width: 36}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: 100 + insets.bottom}]}>

        {/* ── Status Banner ── */}
        <View style={styles.statusBanner}>
          <Text style={styles.statusIcon}>✅</Text>
          <View style={styles.statusTextCol}>
            <Text style={styles.statusTitle}>Order Confirmed</Text>
            {orderDate ? (
              <Text style={styles.statusSub}>Placed on {orderDate}</Text>
            ) : null}
          </View>
        </View>

        {/* ── Delivery Info ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryIcon}>🚚</Text>
            <View>
              <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
              <Text style={styles.deliveryValue}>2 – 4 Business Days</Text>
            </View>
          </View>
          <View style={styles.deliveryRow}>
            <Text style={styles.deliveryIcon}>📍</Text>
            <View>
              <Text style={styles.deliveryLabel}>Shipping To</Text>
              <Text style={styles.deliveryValue}>{location.address || 'Saved Address'}</Text>
            </View>
          </View>
        </View>

        {/* ── Items ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Items Ordered ({items.length})
          </Text>
          {items.map((item: any, idx: number) => {
            const isUri =
              typeof item.image === 'string' &&
              (item.image.startsWith('http') || item.image.startsWith('data:'));
            const displayPrice = item.priceForSize ?? Number(item.price);
            return (
              <View
                key={`${item.id}-${item.size ?? 'default'}`}
                style={[styles.itemRow, idx < items.length - 1 && styles.itemRowBorder]}>
                <View style={styles.itemThumb}>
                  {isUri ? (
                    <Image
                      source={{uri: item.image}}
                      style={styles.thumbImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{fontSize: 22}}>📦</Text>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  {item.size ? (
                    <Text style={styles.itemMeta}>Size: {item.size}</Text>
                  ) : null}
                  <Text style={styles.itemMeta}>Qty: {item.qty}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{(displayPrice * item.qty).toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Price Breakdown ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total MRP</Text>
            <Text style={styles.priceValue}>₹{mrpTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Discount on MRP</Text>
            <Text style={[styles.priceValue, {color: COLORS.success}]}>
              −₹{discount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            <Text style={[styles.priceValue, shipping === 0 && {color: COLORS.success}]}>
              {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>

          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>
              🎉 You saved ₹{discount.toFixed(2)} on this order!
            </Text>
          </View>
        </View>

        {/* ── Payment Details ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.payRow}>
            <Text style={styles.payIcon}>💳</Text>
            <View style={{flex: 1}}>
              <Text style={styles.payLabel}>{paymentMethod || 'Razorpay (Online)'}</Text>
              {paymentId ? (
                <Text style={styles.payMeta}>Txn ID: {paymentId}</Text>
              ) : null}
              <Text style={styles.payMeta}>Amount: ₹{total.toFixed(2)}</Text>
            </View>
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>PAID</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* ── Sticky Track Order Button ── */}
      <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        <TouchableOpacity
          style={styles.trackBtn}
          activeOpacity={0.88}
          delayPressIn={0}
          onPress={() => {
            navigation.navigate('TrackOrder', {
              orderId,
              orderDate,
              items,
              total,
            });
          }}>
          {/* <Text style={styles.trackBtnIcon}>📦</Text> */}
          <Text style={styles.trackBtnText}>Track Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Header ────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 35,
    height: 35,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    //fontFamily: 'Inter-Regular',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: COLORS.subtext,
    marginTop: 1,
  },

  scrollContent: {
    padding: 14,
    gap: 12,
  },

  // ── Status Banner ─────────────────────────
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'black',
  },
  statusIcon: {
    fontSize: 28
  },
  statusTextCol: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.success,
  },
  statusSub: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },

  // ── Card ──────────────────────────────────
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.subtext,
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // ── Delivery ──────────────────────────────
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  deliveryIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  deliveryLabel: {
    fontSize: 11,
    color: COLORS.subtext,
  },
  deliveryValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    marginTop: 1,
  },

  // ── Items ─────────────────────────────────
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  itemThumb: {
    width: 56,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    lineHeight: 17,
  },
  itemMeta: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
  },

  // ── Price Breakdown ───────────────────────
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
  },
  savingsBadge: {
    backgroundColor: COLORS.successLight,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.success,
  },

  // ── Payment ───────────────────────────────
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  payIcon: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  payLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    flex: 1,
  },
  payMeta: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 2,
  },
  paidBadge: {
    backgroundColor: COLORS.successLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.success,
    letterSpacing: 0.5,
  },

  // ── Footer ────────────────────────────────
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingVertical: 14,
  },
  trackBtnIcon: {
    fontSize: 18,
  },
  trackBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
