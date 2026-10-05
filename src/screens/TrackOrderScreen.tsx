import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import {useLocation} from '../context/LocationContext';

type TimelineStep = {
  id: string;
  title: string;
  subtitle: string;
  time?: string;
  isCompleted: boolean;
  isActive?: boolean;
};


export default function TrackOrderScreen({navigation, route}: any) 
{

  const {location} = useLocation();

  const insets = useSafeAreaInsets();
  const {
    orderId = 'ORD89234120',
    orderDate = 'Today',
    items = [],
    total = 0,
  } = route?.params ?? {};

  // Timeline steps as requested: Order placed, Packed, Shipped, Out for Delivery, Delivered
  // 'Order placed' and 'Packed' remain prefilled (completed)
  const steps: TimelineStep[] = [
    {
      id: '1',
      title: 'Order placed',
      subtitle: 'Your order has been received and confirmed',
      time: orderDate ? `${orderDate} • 10:30 AM` : '10:30 AM',
      isCompleted: true,
    },
    {
      id: '2',
      title: 'Packed',
      subtitle: 'Seller has packaged and verified the items',
      time: orderDate ? `${orderDate} • 02:45 PM` : '02:45 PM',
      isCompleted: true,
    },
    {
      id: '3',
      title: 'Shipped',
      subtitle: 'Handed over to delivery courier partner',
      isCompleted: false,
    },
    {
      id: '4',
      title: 'Out for Delivery',
      subtitle: 'Courier agent will arrive at your address soon',
      isCompleted: false,
    },
    {
      id: '5',
      title: 'Delivered',
      subtitle: 'Package safely delivered to recipient',
      isCompleted: false,
    },
  ];

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <StatusBar
        barStyle="dark-content"
        {...(Platform.OS === 'android' ? {backgroundColor: COLORS.card, translucent: false} : {})}
      />

      {/* ── Top Header ── */}
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
          <Text style={styles.headerTitle}>Track Order</Text>
          {orderId ? <Text style={styles.headerSub}>ID: #{orderId}</Text> : null}
        </View>
        <View style={{width: 36}} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: 40 + insets.bottom}]}>
        
        {/* ── Status Highlight Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroBadgeText}>IN TRANSIT</Text>
              <Text style={styles.heroEstimatedTitle}>Arriving by Tomorrow</Text>
              <Text style={styles.heroEstimatedSub}>Expected delivery between 10 AM - 7 PM</Text>
            </View>
            <View style={styles.heroIconBox}>
              <Text style={{fontSize: 28}}>🚚</Text>
            </View>
          </View>
          {items.length > 0 && (
            <View style={styles.heroItemsFooter}>
              <Text style={styles.heroItemsText}>
                📦 {items.length} item{items.length > 1 ? 's' : ''}{total ? ` • Total $${Number(total).toFixed(2)}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* ── Vertical Timeline Chart ── */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionHeading}>Order Status</Text>

          <View style={styles.timelineList}>
            {steps.map((step, idx) => {
              const isLast = idx === steps.length - 1;
              const nextStep = !isLast ? steps[idx + 1] : null;
              const lineCompleted = step.isCompleted && (nextStep?.isCompleted ?? false);

              return (
                <View key={step.id} style={styles.timelineItem}>
                  {/* Vertical Column: Circle & Line */}
                  <View style={styles.indicatorCol}>
                    {/* Circle Indicator */}
                    <View
                      style={[
                        styles.circle,
                        step.isCompleted ? styles.circleFilled : styles.circleEmpty,
                      ]}>
                      {step.isCompleted ? (
                        <Text style={styles.checkmark}>✓</Text>
                      ) : (
                        <View style={styles.innerDot} />
                      )}
                    </View>

                    {/* Connecting Vertical Line */}
                    {!isLast && (
                      <View
                        style={[
                          styles.verticalLine,
                          lineCompleted ? styles.lineFilled : styles.lineEmpty,
                        ]}
                      />
                    )}
                  </View>

                  {/* Right Side Details */}
                  <View style={[styles.textCol, isLast ? styles.textColLast : null]}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.stepTitle,
                          step.isCompleted ? styles.stepTitleCompleted : styles.stepTitlePending,
                        ]}>
                        {step.title}
                      </Text>
                      {step.time ? (
                        <Text style={styles.stepTime}>{step.time}</Text>
                      ) : null}
                    </View>

                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Delivery Address Summary Card ── */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeading}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <View style={{flex: 1}}>
              <Text style={styles.addressTitle}> {location.address || 'Saved Address'}</Text>
              <Text style={styles.addressDetail}>
                Verified Customer Address, Explorify Express Hub
              </Text>
            </View>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <TouchableOpacity
          style={styles.homeBtn}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Home')}
          delayPressIn={0}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
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
    width: 24,
    height: 24,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    // fontFamily: 'Inter-Regular',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 1,
  },

  scrollContent: {
    padding: 14,
    gap: 12,
  },

  // ── Hero Card ─────────────────────────────
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.success,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroEstimatedTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
  },
  heroEstimatedSub: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  heroIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroItemsFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  heroItemsText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textSecondary,
  },

  // ── Timeline Card ─────────────────────────
  timelineCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.subtext,
    letterSpacing: 0.6,
    marginBottom: 16,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 68,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  circleFilled: {
    backgroundColor: COLORS.success,
  },
  circleEmpty: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
  },
  verticalLine: {
    width: 2.5,
    flex: 1,
    marginVertical: 3,
  },
  lineFilled: {
    backgroundColor: COLORS.success,
  },
  lineEmpty: {
    backgroundColor: COLORS.borderLight,
  },

  // ── Text Column (Right side of circles) ───
  textCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 22,
    justifyContent: 'flex-start',
  },
  textColLast: {
    paddingBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  stepTitleCompleted: {
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  stepTitlePending: {
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: COLORS.muted,
  },
  stepTime: {
    fontSize: 11,
    color: COLORS.subtext,
  },
  stepSubtitle: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 3,
    lineHeight: 16,
  },

  // ── Info Card ─────────────────────────────
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addressIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  addressTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  addressDetail: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
    lineHeight: 16,
  },

  // ── Bottom Action ─────────────────────────
  homeBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  homeBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});
