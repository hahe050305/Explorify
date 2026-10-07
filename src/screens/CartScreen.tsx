import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {useLocation} from '../context/LocationContext';
import {customAlert} from '../context/AlertContext';
import COLORS from '../constants/colors';
import {
  useCart,
  removeFromCart,
  updateQty,
  getCartTotal,
  clearCart,
} from '../store/shopStore';
import {processRazorpayPayment} from '../services/razorpayService';

export default function CartScreen({navigation}: any) {
  const insets = useSafeAreaInsets();
  const {user, isGuest} = useAuth();
  const cart = useCart();

  const subtotal = getCartTotal();
  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 4.99;
  const discountSavings = (subtotal * 0.15).toFixed(2);
  const total = subtotal + shipping;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { location } = useLocation();

  const handleCheckout = async () => {
    if (isGuest) {
      customAlert('Guest Checkout', 'Please sign in or create an account to complete your purchase.', [
        {text: 'Cancel', onPress: () => {}, style: 'cancel'},
        {text: 'Sign In', onPress: () => navigation.navigate('Login')},
        {text: 'Register', onPress: () => navigation.navigate('Register')},
      ]);
      return;
    }
    if (!user) {
      customAlert('Sign In Required', 'Please sign in to place your order.');
      return;
    }

    if (!cart || cart.length === 0) {
      customAlert('Empty Bag', 'Your shopping bag is empty.');
      return;
    }

    setIsProcessingPayment(true);
    const orderItems = [...cart];
    const generatedOrderId = `ORD${Date.now().toString().slice(-8)}`;

    try {
      await processRazorpayPayment({
        amount: total,
        appOrderId: generatedOrderId,
        user,
        items: orderItems,
        shippingAddress: location?.address || 'Saved Address',
        onSuccess: (result) => {
          setIsProcessingPayment(false);
          clearCart();
          navigation.navigate('OrderPlaced', {
            items: orderItems,
            subtotal,
            shipping,
            total,
            orderId: result.appOrderId || generatedOrderId,
            paymentId: result.paymentId,
            razorpayOrderId: result.orderId,
            paymentMethod: 'Razorpay (Online)',
            orderDate: new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
          });
        },
        onError: (error) => {
          setIsProcessingPayment(false);
          console.error('Payment Error:', error);
          customAlert(
            'Payment Notice',
            error.message || 'Payment could not be completed. Please try again.'
          );
        },
        onCancel: () => {
          setIsProcessingPayment(false);
        },
      });
    } catch (err: any) {
      setIsProcessingPayment(false);
      customAlert('Error', err.message || 'An unexpected error occurred during checkout');
    }
  };

  const renderItem = ({item}: any) => {
    const isUri = typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('data:'));
    const displayPrice = item.priceForSize ?? Number(item.price);

    return (
      <View style={styles.cartCard}>
        <View style={styles.itemThumbBox}>
          {isUri ? (
            <Image source={{uri: item.image}} style={styles.thumbImage} resizeMode="cover" />
          ) : (
           <Text style={{fontSize: 26}}>📦</Text>
          )}
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.name}</Text>
          {item.size && (
            <Text style={{fontSize: 11, color: '#888', marginTop: 2}}>Size: {item.size}</Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>₹{displayPrice.toFixed(2)}</Text>
            <Text style={styles.itemMrp}>₹{(displayPrice * 1.35).toFixed(2)}</Text>
          </View>
          <Text style={styles.deliveryNote}>Free Delivery</Text>

        <View style={styles.actionsRow}>
          <View style={styles.qtyBox}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQty(item.id, item.qty - 1, item.size)}
              activeOpacity={0.7}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{item.qty}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQty(item.id, item.qty + 1, item.size)}
              activeOpacity={0.7}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => removeFromCart(item.id, item.size)}
            style={styles.removeBtn}
            activeOpacity={0.7}>
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )}

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" {...(Platform.OS === 'android' ? {backgroundColor: '#FFFFFF', translucent: false} : {})} />

      {/* Top Header */}
      <View style={styles.topHeader}>
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
        <View>
          <Text style={styles.headerTitle}>Shopping Bag</Text>
          <Text style={styles.headerSub}>{cart.length} item(s)</Text>
        </View>
        <View style={{width: 36}} />
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛍️</Text>
          <Text style={styles.emptyTitle}>Your Shopping Bag is empty</Text>
          <Text style={styles.emptySub}>Explore our catalog and find the best items for you.</Text>
          <TouchableOpacity
            style={styles.shopNowBtn}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Home')}
            delayPressIn={0}>
            <Text style={styles.shopNowText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderItem}
            keyExtractor={i => `${i.id}-${i.size || 'default'}`}
            contentContainerStyle={[styles.listContent, {paddingBottom: 90 + insets.bottom}]}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <View style={styles.deliveryPill}>
                <Text style={styles.deliveryPillIcon}>⚡</Text>
                <Text style={styles.deliveryPillText}>
                  {shipping === 0 ? 'Free delivery unlocked on this order!' : 'Add items over ₹50 for free delivery'}
                </Text>
              </View>
            )}
            ListFooterComponent={() => (
              <View style={styles.priceBreakdownCard}>
                <Text style={styles.breakdownHeading}>PRICE DETAILS ({cart.length} Items)</Text>
                
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Total MRP</Text>
                  <Text style={styles.breakdownValue}>₹{(subtotal * 1.35).toFixed(2)}</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Discount on MRP</Text>
                  <Text style={[styles.breakdownValue, {color: COLORS.success}]}>
                    −₹{(subtotal * 0.35).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Delivery Fee</Text>
                  <Text style={[styles.breakdownValue, shipping === 0 && {color: COLORS.success}]}>
                    {shipping === 0 ? 'FREE' : `₹ ${shipping.toFixed(2)}`}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.breakdownRow}>
                  <Text style={styles.totalAmountLabel}>Total Amount</Text>
                  <Text style={styles.totalAmountValue}>₹{total.toFixed(2)}</Text>
                </View>

                <View style={styles.savingsTag}>
                  <Text style={styles.savingsTagText}>
                    You will save ₹{(subtotal * 0.35).toFixed(2)} on this order
                  </Text>
                </View>
              </View>
            )}
          />

          {/* Sticky Checkout Bar */}
          <View style={[styles.stickyFooter, {paddingBottom: Math.max(insets.bottom, 12)}]}>
            <View style={styles.footerPriceCol}>
              <Text style={styles.footerTotalLabel}>Total Amount</Text>
              <Text style={styles.footerTotalVal}>₹{total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.checkoutBtn, isProcessingPayment && {opacity: 0.75}]}
              onPress={handleCheckout}
              disabled={isProcessingPayment}
              delayPressIn={0}
              activeOpacity={0.88}>
              {isProcessingPayment ? (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.checkoutBtnText}>Processing...</Text>
                </View>
              ) : (
                <Text style={styles.checkoutBtnText}>Pay with Razorpay</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.subtext,
    textAlign: 'center',
  },

  // ── Delivery Banner ───────────────────────
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliveryPillIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  deliveryPillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
  },

  listContent: {
    padding: 14,
  },

  // ── Cart Card ─────────────────────────────
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemThumbBox: {
    width: 68,
    height: 76,
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
    marginRight: 6,
  },
  itemMrp: {
    fontSize: 12,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
  },
  deliveryNote: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.cardSecondary,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  qtyValue: {
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeBtnText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },

  // ── Price Details Breakdown ───────────────
  priceBreakdownCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  breakdownHeading: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.subtext,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  breakdownValue: {
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
  totalAmountLabel: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
  },
  totalAmountValue: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
  },
  savingsTag: {
    backgroundColor: COLORS.successLight,
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  savingsTagText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },

  // ── Empty State ───────────────────────────
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  shopNowBtn: {
    backgroundColor: COLORS.text,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  shopNowText: {
    color: COLORS.white,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },

  // ── Sticky Checkout Footer ────────────────
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  footerPriceCol: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 11,
    color: COLORS.subtext,
  },
  footerTotalVal: {
    fontSize: 19,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  }
});



