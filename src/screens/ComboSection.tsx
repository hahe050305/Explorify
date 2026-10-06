// src/screens/ComboSection.tsx
// ─────────────────────────────────────────────────────────
// Explorify Combo Deals Screen
// Full-screen card experience with snap scroll, dynamic reveal
// transitions, high-visibility product showcase, and one-tap bundle checkout.
// ─────────────────────────────────────────────────────────

import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import COLORS from '../constants/colors';
import { addToCart } from '../store/shopStore';
import { useGlobalProducts } from '../context/ProductContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const THUMB_SIZE = Math.min(Math.max(Math.floor((SCREEN_W - 104) / 3), 82), 94);

// ─── Psychology-based cross-category combo templates ─────────────
const LIFESTYLE_TEMPLATES: Array<{
  label: string;
  tag: string;
  subtitle: string;
  keywords: string[];
  accentColor: string;
}> = [
  {
    label: 'Street Style Set',
    tag: 'FASHION',
    subtitle: 'Head-to-toe urban aesthetic bundle',
    keywords: ['shoe', 'footwear', 'cap', 'hat', 'shirt', 'tshirt', 'top'],
    accentColor: '#FF6B00',
  },
  {
    label: 'Work From Anywhere',
    tag: 'TECH ESSENTIALS',
    subtitle: 'High-productivity mobile gear package',
    keywords: ['laptop', 'bag', 'mouse', 'keyboard', 'headphone', 'monitor'],
    accentColor: '#2874F0',
  },
  {
    label: 'Monsoon Ready Kit',
    tag: 'SEASONAL',
    subtitle: 'All-weather protection essentials',
    keywords: ['umbrella', 'raincoat', 'boot', 'waterproof'],
    accentColor: '#0A84FF',
  },
  {
    label: 'Fitness Power Pack',
    tag: 'SPORT & HEALTH',
    subtitle: 'Complete training & active lifestyle gear',
    keywords: ['gym', 'sport', 'protein', 'bottle', 'track', 'dumbbell'],
    accentColor: '#00875A',
  },
  {
    label: 'Winter Warmth Bundle',
    tag: 'SEASONAL',
    subtitle: 'Cozy thermal comfort collection',
    keywords: ['sweater', 'jacket', 'muffler', 'glove', 'hoodie', 'coat', 'winter'],
    accentColor: '#5E35B1',
  },
  {
    label: 'Kitchen Pro Essentials',
    tag: 'HOME CHEF',
    subtitle: 'Culinary prep tools for gourmet dishes',
    keywords: ['kitchen', 'blender', 'mixer', 'cooker', 'pan', 'juicer'],
    accentColor: '#E65100',
  },
  {
    label: 'Grooming & Glow Kit',
    tag: 'PERSONAL CARE',
    subtitle: 'Daily self-care routine essentials',
    keywords: ['shampoo', 'cream', 'face', 'skin', 'beard', 'grooming'],
    accentColor: '#00838F',
  },
  {
    label: 'Modern Desk Setup',
    tag: 'WORKSPACE',
    subtitle: 'Ergonomic workspace transformation set',
    keywords: ['desk', 'chair', 'lamp', 'monitor', 'organizer', 'stand'],
    accentColor: '#37474F',
  },
];

type Combo = {
  id: string;
  label: string;
  tag: string;
  subtitle: string;
  items: any[];
  accentColor: string;
};

// ─── Build combos: lifestyle templates + same-category fallbacks ──
const buildCombos = (products: any[]): Combo[] => {
  const combos: Combo[] = [];
  const usedIds = new Set<number>();

  // 1. Lifestyle combos
  LIFESTYLE_TEMPLATES.forEach((tpl) => {
    const matched: any[] = [];
    tpl.keywords.forEach((kw) => {
      products.forEach((p) => {
        if (
          !usedIds.has(p.id) &&
          matched.length < 3 &&
          (p.category?.toLowerCase().includes(kw) || p.name?.toLowerCase().includes(kw))
        ) {
          matched.push(p);
          usedIds.add(p.id);
        }
      });
    });
    if (matched.length >= 2) {
      combos.push({
        id: `lifestyle_${tpl.label}`,
        label: tpl.label,
        tag: tpl.tag,
        subtitle: tpl.subtitle,
        items: matched.slice(0, 3),
        accentColor: tpl.accentColor,
      });
    }
  });

  // 2. Same-category fallback bundles
  const groups: { [cat: string]: any[] } = {};
  products.forEach((p) => {
    if (usedIds.has(p.id)) return;
    const cat = p.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });

  const catPalette = ['#C62828', '#283593', '#2E7D32', '#F57F17', '#6A1B9A', '#00838F', '#BF360C'];
  let pi = 0;
  Object.entries(groups).forEach(([cat, items]) => {
    if (items.length < 2) return;
    combos.push({
      id: `cat_${cat}`,
      label: `${cat} Value Pack`,
      tag: 'CURATED BUNDLE',
      subtitle: `Best-selling ${cat.toLowerCase()} essentials bundled together`,
      items: items.slice(0, 3),
      accentColor: catPalette[pi++ % catPalette.length],
    });
  });

  return combos;
};

// ─── High-Visibility Product Card inside Combo ────────────────────
const ComboProductThumb = React.memo(({
  product,
  accentColor,
  onPress,
}: {
  product: any;
  accentColor: string;
  onPress: () => void;
}) => {
  const isUri =
    typeof product.image === 'string' &&
    (product.image.startsWith('http') || product.image.startsWith('data:'));

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.productThumbWrap}
      onPress={onPress}
    >
      <View style={[styles.productImageContainer, { borderColor: accentColor + '25' }]}>
        {isUri ? (
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.productEmoji}>{product.image || '🛍️'}</Text>
        )}
      </View>
      <Text style={styles.productTitle} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.productPrice}>₹{product.price?.toFixed(2)}</Text>
    </TouchableOpacity>
  );
});

// ─── Single Full-Screen Combo Card ────────────────────────────────
interface ComboCardProps {
  item: Combo;
  index: number;
  totalCount: number;
  cardHeight: number;
  scrollY: Animated.Value;
}

const FullScreenComboCard = React.memo(({
  item,
  index,
  totalCount,
  cardHeight,
  scrollY,
}: ComboCardProps) => {
  const navigation = useNavigation<any>();
  const [added, setAdded] = useState(false);
  const { label, tag, subtitle, items, accentColor } = item;

  const totalPrice = items.reduce((s, p) => s + (p.price || 0), 0);
  const totalMrp = totalPrice * 1.35;
  const savings = totalMrp - totalPrice;
  const discountPct = Math.round((savings / totalMrp) * 100);

  const handleAddAll = useCallback(() => {
    items.forEach((p) => {
      addToCart({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
      });
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2200);
  }, [items]);

  // Interpolated smooth scroll reveal & scale animations
  const inputRange = [
    (index - 1) * cardHeight,
    index * cardHeight,
    (index + 1) * cardHeight,
  ];

  const cardScale = scrollY.interpolate({
    inputRange,
    outputRange: [0.94, 1, 0.94],
    extrapolate: 'clamp',
  });

  const cardOpacity = scrollY.interpolate({
    inputRange,
    outputRange: [0.55, 1, 0.55],
    extrapolate: 'clamp',
  });

  const cardTranslateY = scrollY.interpolate({
    inputRange,
    outputRange: [16, 0, -16],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.cardSlot, { height: cardHeight }]}>
      <Animated.View
        style={[
          styles.cardOuter,
          {
            opacity: cardOpacity,
            transform: [
              { scale: cardScale },
              { translateY: cardTranslateY },
            ],
          },
        ]}
      >
        {/* Top Accent Strip */}
        <View style={[styles.cardTopAccent, { backgroundColor: accentColor }]} />

        {/* 1. Card Header & Title Group */}
        <View style={styles.cardHeaderContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.tagPill, { backgroundColor: accentColor + '15' }]}>
              <Text style={[styles.tagText, { color: accentColor }]}>{tag}</Text>
            </View>

            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                BUNDLE {index + 1} OF {totalCount}
              </Text>
            </View>

            <View style={styles.discountPill}>
              <Text style={styles.discountPillText}>{discountPct}% OFF</Text>
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.comboTitle} numberOfLines={2}>
              {label}
            </Text>
            <Text style={styles.comboSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
        </View>

        {/* 2. High-Visibility Product Showcase */}
        <View style={styles.showcaseBox}>
          <View style={styles.productsRow}>
            {items.map((p, i) => (
              <React.Fragment key={p.id}>
                {i > 0 && (
                  <View style={styles.plusSeparator}>
                    <Text style={styles.plusSymbol}>+</Text>
                  </View>
                )}
                <ComboProductThumb
                  product={p}
                  accentColor={accentColor}
                  onPress={() =>
                    navigation.navigate('ProductDetails', {
                      product: p,
                      productId: p.id,
                    })
                  }
                />
              </React.Fragment>
            ))}
          </View>
          <Text style={styles.tapHint}>Tap any item to view product details</Text>
        </View>

        {/* 3. Value Perks Strip */}
        <View style={styles.perksRow}>
          <View style={styles.perkItem}>
            <Text style={styles.perkIcon}>⚡</Text>
            <Text style={styles.perkText}>Extra {discountPct}% Off</Text>
          </View>
          <View style={styles.perkDivider} />
          <View style={styles.perkItem}>
            <Text style={styles.perkIcon}>🚚</Text>
            <Text style={styles.perkText}>Free Delivery</Text>
          </View>
          <View style={styles.perkDivider} />
          <View style={styles.perkItem}>
            <Text style={styles.perkIcon}>🛡️</Text>
            <Text style={styles.perkText}>Verified Deal</Text>
          </View>
        </View>

        {/* 4. Pricing & Savings Breakdown Box */}
        <View style={styles.priceContainer}>
          <View style={styles.priceLeft}>
            <Text style={styles.priceLabel}>COMBO DEAL PRICE</Text>
            <View style={styles.priceFiguresRow}>
              <Text style={styles.totalPrice}>₹{totalPrice.toFixed(2)}</Text>
              <Text style={styles.totalMrp}>₹{totalMrp.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeTitle}>INSTANT SAVINGS</Text>
            <Text style={styles.savingsBadgeAmount}>Save ₹{savings.toFixed(2)}</Text>
          </View>
        </View>

        {/* 5. Add All To Cart Action Button */}
        <TouchableOpacity
          activeOpacity={0.82}
          style={[
            styles.actionButton,
            added
              ? styles.actionButtonSuccess
              : { backgroundColor: COLORS.primary },
          ]}
          onPress={handleAddAll}
        >
          <Text style={styles.actionButtonText}>
            {added
              ? `✓ Added ${items.length} Items to Cart!`
              : `Add All ${items.length} Items to Cart • ₹${totalPrice.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// ─── Main ComboSection Component ──────────────────────────────────
const ComboSection: React.FC = () => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const { products, loading } = useGlobalProducts();
  const combos = useMemo(() => buildCombos(products), [products]);

  // Dynamic layout measurement to ensure 100% viewport fit on all devices
  const [containerHeight, setContainerHeight] = useState(
    Math.max(SCREEN_H * 0.70, 500)
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 300 && Math.abs(height - containerHeight) > 2) {
      setContainerHeight(height);
    }
  }, [containerHeight]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Curating exclusive bundles...</Text>
      </View>
    );
  }

  if (combos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🎁</Text>
        <Text style={styles.emptyTitle}>No combos available right now</Text>
        <Text style={styles.emptyText}>
          Check back soon for freshly curated multi-item bundle deals.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root} onLayout={onLayout}>
      <Animated.FlatList
        data={combos}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FullScreenComboCard
            item={item}
            index={index}
            totalCount={combos.length}
            cardHeight={containerHeight}
            scrollY={scrollY}
          />
        )}
        showsVerticalScrollIndicator={false}
        snapToInterval={containerHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        pagingEnabled={Platform.OS === 'android'}
        getItemLayout={(_, index) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
};

// ─── Proportioned Contemporary Minimalist Design System ───────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F4F8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F1F4F8',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: COLORS.subtext,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Card Container Slot Centering Each Card ─────────────────────
  cardSlot: {
    width: SCREEN_W,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardOuter: {
    width: '100%',
    height: '100%',
    maxHeight: 630,
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },

  // ── Card Header & Title Group ───────────────────────────────────
  cardHeaderContainer: {
    width: '100%',
    marginTop: 2,
    marginBottom: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: 0.5,
  },
  counterBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  counterText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  discountPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  discountPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    color: '#DC2626',
    letterSpacing: 0.3,
  },

  // ── Title Section ───────────────────────────────────────────────
  titleSection: {
    marginTop: 3,
  },
  comboTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    color: '#0F172A',
    letterSpacing: -0.4,
    lineHeight: 25,
    textAlign: 'center',
  },
  comboSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginTop: 3,
    lineHeight: 17,
    textAlign: 'center',
  },

  // ── High-Visibility Product Showcase Container ──────────────────
  showcaseBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  productsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  productThumbWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  productImageContainer: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
      },
      android: {
        elevation: 2.5,
      },
    }),
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productEmoji: {
    fontSize: 32,
  },
  productTitle: {
    width: '100%',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 2,
    lineHeight: 14,
    minHeight: 28,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#0F172A',
    marginTop: 2,
  },
  plusSeparator: {
    width: 10,
    height: THUMB_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusSymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tapHint: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: 8,
  },

  // ── Perks Strip ─────────────────────────────────────────────────
  perksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perkIcon: {
    fontSize: 11,
  },
  perkText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
  },
  perkDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
  },

  // ── Pricing & Savings Banner ────────────────────────────────────
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 10,
  },
  priceLeft: {
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  priceFiguresRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 21,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  totalMrp: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontFamily: 'Inter-Medium',
  },
  savingsBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  savingsBadgeTitle: {
    fontSize: 8.5,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    color: '#059669',
    letterSpacing: 0.3,
  },
  savingsBadgeAmount: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    color: '#047857',
    marginTop: 1,
  },

  // ── Action Button ───────────────────────────────────────────────
  actionButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionButtonSuccess: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default ComboSection;
