import React, {useState, useRef, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform,
  PanResponder,
  Animated,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { useGlobalProducts } from '../context/ProductContext';

const SIZE_MULTIPLIERS: Record<string, number> = { S: 1.0, M: 1.05, L: 1.10, XL: 1.15 };
import {CartCountBadge, WishlistCountBadge} from '../components/CountBadge';
import {addToCart, toggleWishlist, useIsWishlisted} from '../store/shopStore';

export default function ProductDetails({route, navigation}: any) {
  const insets = useSafeAreaInsets();
  const { product: initialProduct, productId } = route.params || {};
  const { products: cachedProducts } = useGlobalProducts();

  // Fetch product from cache via useMemo to avoid unwanted API calls
  const product = useMemo(() => {
    if (initialProduct) return initialProduct;
    if (productId != null) {
      const idNum = Number(productId);
      return (
        cachedProducts.find(p => p.id === idNum) ||
        MOCK_PRODUCTS.find(m => m.id === idNum) ||
        null
      );
    }
    return null;
  }, [initialProduct, productId, cachedProducts]);

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('S');
  const isFavorite = useIsWishlisted(product?.id ?? -1);

  // ── Pinch-to-Zoom & Pan State ────────────────────────
  const [isZoomed, setIsZoomed] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const pan = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const scale = useRef(new Animated.Value(1)).current;
  // ── Product Description Expand State ──────────────────
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // ── Customer Reviews State & Handlers ─────────────────
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: 'Alice M.',
      rating: 5,
      comment: 'Absolutely love the quality! Fits perfectly and the material is super soft.',
      isUser: false,
    },
    {
      id: 2,
      name: 'James R.',
      rating: 4,
      comment: 'Great product overall. Delivery was fast and packaging was neat.',
      isUser: false,
    },
    {
      id: 3,
      name: 'Sara K.',
      rating: 3,
      comment: 'Decent quality but runs a bit small. Would suggest sizing up.',
      isUser: false,
    },
    {
      id: 4,
      name: 'Tom H.',
      rating: 5,
      comment: 'Exceeded my expectations! Will definitely buy again.',
      isUser: false,
    },
  ]);

  // ── Top "Write a Review" State ───────────────────────
  const [reviewInput, setReviewInput] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  // ── In-place Review Edit State ───────────────────────
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);

  const avgRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map(star => {
      const count = reviews.filter(r => r.rating === star).length;
      return {
        label: `${star}★`,
        pct: count / total,
      };
    });
  }, [reviews]);

  // Appends new review from top "Write a Review" section
  const handleSubmitReview = () => {
    const trimmed = reviewInput.trim();
    if (!trimmed) return;

    const newReview = {
      id: Date.now(),
      name: 'You',
      rating: reviewRating,
      comment: trimmed,
      isUser: true,
    };
    setReviews(prev => [...prev, newReview]);
    setReviewInput('');
    setReviewRating(5);
  };

  // In-place edit handlers
  const handleStartInplaceEdit = (review: {id: number; rating: number; comment: string}) => {
    setEditingReviewId(review.id);
    setEditComment(review.comment);
    setEditRating(review.rating);
  };

  const handleSaveInplaceEdit = (id: number) => {
    const trimmed = editComment.trim();
    if (!trimmed) return;
    setReviews(prev =>
      prev.map(r => (r.id === id ? {...r, comment: trimmed, rating: editRating} : r)),
    );
    setEditingReviewId(null);
    setEditComment('');
  };

  const handleCancelInplaceEdit = () => {
    setEditingReviewId(null);
    setEditComment('');
  };

  // Delete user's review
  const handleDeleteReview = (id: number) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    if (editingReviewId === id) {
      setEditingReviewId(null);
      setEditComment('');
    }
  };

  const currentScaleRef = useRef(1);
  const currentPanRef = useRef({x: 0, y: 0});
  const initialDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef(1);

  const resetZoom = () => {
    Animated.parallel([
      Animated.spring(scale, {toValue: 1, useNativeDriver: false}),
      Animated.spring(pan, {toValue: {x: 0, y: 0}, useNativeDriver: false}),
    ]).start(() => {
      currentScaleRef.current = 1;
      currentPanRef.current = {x: 0, y: 0};
      setIsZoomed(false);
      setScrollEnabled(true);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          evt.nativeEvent.touches.length >= 2 ||
          (currentScaleRef.current > 1.05 &&
            (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3))
        );
      },
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length >= 2) {
          const [t1, t2] = evt.nativeEvent.touches;
          const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          initialDistanceRef.current = dist;
          initialScaleRef.current = currentScaleRef.current;
        }
        setScrollEnabled(false);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length >= 2) {
          const [t1, t2] = evt.nativeEvent.touches;
          const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);
          if (initialDistanceRef.current && initialDistanceRef.current > 0) {
            const nextScale = Math.min(
              Math.max(1, (dist / initialDistanceRef.current) * initialScaleRef.current),
              3.5,
            );
            scale.setValue(nextScale);
            currentScaleRef.current = nextScale;
            setIsZoomed(nextScale > 1.05);
          }
        } else if (currentScaleRef.current > 1.05) {
          // Pan when zoomed
          const maxPanX = (currentScaleRef.current - 1) * 160;
          const maxPanY = (currentScaleRef.current - 1) * 140;
          const newX = Math.max(
            -maxPanX,
            Math.min(maxPanX, currentPanRef.current.x + gestureState.dx),
          );
          const newY = Math.max(
            -maxPanY,
            Math.min(maxPanY, currentPanRef.current.y + gestureState.dy),
          );
          pan.setValue({x: newX, y: newY});
        }
      },
      onPanResponderRelease: () => {
        initialDistanceRef.current = null;
        if (currentScaleRef.current <= 1.05) {
          resetZoom();
        } else {
          currentPanRef.current = {
            x: (pan.x as any)._value || 0,
            y: (pan.y as any)._value || 0,
          };
          setIsZoomed(true);
        }
      },
      onPanResponderTerminate: () => {
        initialDistanceRef.current = null;
        if (currentScaleRef.current <= 1.05) {
          resetZoom();
        }
      },
    }),
  ).current;

    // Check if product belongs to clothing/fashion/footwear to show size selection
  const categoryStr = String(product?.category || '').toLowerCase();
  const isClothing = categoryStr.includes('cloth') || 
                     categoryStr.includes('fashion') || 
                     categoryStr.includes('shoe') || 
                     categoryStr.includes('footwear') || 
                     categoryStr.includes('wear') || 
                     categoryStr.includes('apparel');

  // Dynamic price calculation reflecting selected size multiplier
  const sizeMultiplier = isClothing ? (SIZE_MULTIPLIERS[selectedSize] ?? 1.0) : 1.0;
  const basePrice = Number(product?.price || 0);
  const unitPrice = basePrice * sizeMultiplier;

  const handleAdd = () => {
    if (!product) return;
    const cartEntry: any = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: quantity,
    };
    if (isClothing) {
      cartEntry.size = selectedSize;
      cartEntry.priceForSize = unitPrice;
    }
    addToCart(cartEntry);
  };

  if (!product) {
    return (
      <View style={[styles.center, {paddingTop: insets.top}]}>
        <ActivityIndicator size="large" color={COLORS.text} />
      </View>
    );
  }

  const isUri = typeof product.image === 'string' && (product.image.startsWith('http') || product.image.startsWith('data:'));
  const currentPrice = unitPrice.toFixed(2);
  const originalPrice = (unitPrice * 1.35).toFixed(2);
  const discountPercent = Math.round(((Number(originalPrice) - Number(currentPrice)) / Number(originalPrice)) * 100);
  const displayRating = product.rating ? Number(product.rating).toFixed(1) : (4.3 + (((product.id || 1) % 6) * 0.1)).toFixed(1);


  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="dark-content" {...(Platform.OS === 'android' ? {backgroundColor: '#FFFFFF', translucent: false} : {})} />

      {/* Clean Modern E-Commerce Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          // style={styles.iconCircle}
          activeOpacity={0.7}
          delayPressIn={0}>
          <Image
            source={require('../images/icon-back.jpg')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => toggleWishlist({
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image,
              category: product.category,
              rating: product.rating,
            })}
            activeOpacity={0.7}
            delayPressIn={0}>
            <Image
              source={require('../images/icon-wishlist.jpg')}
              style={[styles.headerIcon, isFavorite && styles.headerIconActive]}
              resizeMode="contain"
            />
            <WishlistCountBadge />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconCircle, {marginLeft: 8}]}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.7}
            delayPressIn={0}>
            <Image
              source={require('../images/icon-cart.jpg')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
            <CartCountBadge />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: 90 + insets.bottom}]}
        showsVerticalScrollIndicator={false}>

        {/* Product Media Gallery Container with Amazon-style Pan-Zoom */}
        <View style={[styles.heroWrap, isZoomed && styles.heroWrapZoomed]}>
          <View
            style={styles.heroInteractiveArea}
            {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.heroAnimatedBox,
                {
                  transform: [
                    {scale: scale},
                    {translateX: pan.x},
                    {translateY: pan.y},
                  ],
                },
              ]}>
              {isUri ? (
                <Image
                  source={{uri: product.image}}
                  style={styles.heroImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.heroEmojiWrap}>
                  <Text style={styles.heroEmoji}>{product.image || '🛍️'}</Text>
                </View>
              )}
            </Animated.View>
          </View>

          <View style={styles.assuredBadge}>
            <Text style={styles.assuredText}>✓ Explorify Assured</Text>
          </View>
        </View>

        {/* Product Details & Purchase Options */}
        <View style={styles.infoSection}>
          <Text style={styles.categoryLabel}>{String(product.category).toUpperCase()}</Text>
          <Text style={styles.productTitle}>{product.name}</Text>

          {/* Rating summary - Matches HomeScreen exact rating */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingVal}>{displayRating}</Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>
            <Text style={styles.ratingCount}>2,481 ratings & 319 reviews</Text>
          </View>

          {/* Pricing breakdown (Amazon/Flipkart style) */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>₹{currentPrice}</Text>
              <Text style={styles.origPrice}>₹{originalPrice}</Text>
              <Text style={styles.discountTag}>{discountPercent}% off</Text>
            </View>
            <Text style={styles.taxInclusive}>Inclusive of all taxes</Text>
          </View>

          {/* Size / Option Selector - Only shown for clothing / apparel / footwear */}
          {isClothing && (
            <View style={styles.optionSection}>
              <View style={styles.sizeHeaderRow}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.optionLabel}>Select Size: </Text>
                  {<Text style={[styles.optionLabel, {color: "black"}]}>{selectedSize}</Text>}
                 
                </View>
                <Text style={styles.sizeChartLink}>Size Chart</Text>
              </View>
              <View style={styles.sizeRow}>
                {(['S', 'M', 'L', 'XL'] as const).map(size => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeBtn, selectedSize === size && styles.sizeBtnActive]}
                    onPress={() => setSelectedSize(size)}
                    activeOpacity={0.7}>
                    <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>
                      {size}
                    </Text>
                    <Text style={[styles.sizeMultiplierText, selectedSize === size && styles.sizeMultiplierTextActive]}>
                      {SIZE_MULTIPLIERS[size]}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity selector */}
          <View style={styles.qtyRow}>
            <Text style={styles.optionLabel}>Quantity</Text>
            <View style={styles.stepperWrap}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                activeOpacity={0.7}>
                <Text style={styles.stepperIcon}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperVal}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQuantity(quantity + 1)}
                activeOpacity={0.7}>
                <Text style={styles.stepperIcon}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Delivery & Highlights */}
          <View style={styles.perksContainer}>
            <View style={styles.perkRow}>
              <Text style={styles.perkIcon}>⚡</Text>
              <View>
                <Text style={styles.perkTitle}>Free Delivery by Tomorrow</Text>
                <Text style={styles.perkSub}>Order within 4 hrs 20 mins</Text>
              </View>
            </View>
            <View style={styles.perkRow}>
              <Text style={styles.perkIcon}>🔄</Text>
              <View>
                <Text style={styles.perkTitle}>7 Days Replacement Policy</Text>
                <Text style={styles.perkSub}>Hassle-free pickups & full refunds</Text>
              </View>
            </View>
            <View style={styles.perkRow}>
              <Text style={styles.perkIcon}>💵</Text>
              <View>
                <Text style={styles.perkTitle}>Cash on Delivery Available</Text>
                <Text style={styles.perkSub}>Pay when your item arrives</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descBlock}>
            <View style={styles.descHeaderRow}>
              <Text style={styles.descHeading}>Product Description</Text>
              <TouchableOpacity
                onPress={() => setIsDescExpanded(prev => !prev)}
                style={styles.seeMoreBtn}
                activeOpacity={0.7}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <Text style={styles.seeMoreText}>
                  {isDescExpanded ? 'See less ▲' : 'See more ▼'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              style={styles.descText}
              numberOfLines={isDescExpanded ? undefined : 2}>
              {product.description ||
                'Designed with exceptional craftsmanship and high-grade materials. Built for all-day comfort, durability, and contemporary styling.'}
            </Text>
          </View>
        </View>
        {/* ─── Customer Reviews (full-width, outside infoSection) ─── */}
        <View style={styles.reviewSection}>
          {/* Header bar */}
          <View style={styles.reviewHeaderBar}>
            <Text style={styles.reviewHeading}>Customer Reviews</Text>
            <Text style={styles.reviewSeeAll}>{reviews.length} Total</Text>
          </View>

          {/* Average rating summary */}
          <View style={styles.reviewAvgRow}>
            <View style={styles.reviewAvgLeft}>
              <Text style={styles.reviewAvgScore}>{avgRating}</Text>
              <Text style={styles.reviewAvgLabel}>out of 5</Text>
            </View>
            <View style={styles.reviewAvgRight}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Text
                    key={i}
                    style={[
                      styles.starCharLg,
                      {color: i <= Math.round(Number(avgRating)) ? COLORS.warning : COLORS.border},
                    ]}>
                    ★
                  </Text>
                ))}
              </View>
              <Text style={styles.reviewCount}>{reviews.length} verified ratings</Text>
              {/* Rating bars */}
              {ratingDistribution.map(row => (
                <View key={row.label} style={styles.ratingBarRow}>
                  <Text style={styles.ratingBarLabel}>{row.label}</Text>
                  <View style={styles.ratingBarTrack}>
                    <View style={[styles.ratingBarFill, {width: `${Math.round(row.pct * 100)}%`}]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Write / Edit Review Box */}
          <View style={styles.writeReviewCard}>
            <View style={styles.writeReviewHeader}>
              <Text style={styles.writeReviewTitle}>✍️ Write a Review</Text>
            </View>

            {/* Interactive Star Rating Selector */}
            <View style={styles.ratingSelectorRow}>
              <Text style={styles.ratingSelectorLabel}>Your Rating:</Text>
              <View style={styles.starsSelector}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    activeOpacity={0.7}
                    hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}>
                    <Text
                      style={[
                        styles.selectorStarChar,
                        {color: star <= reviewRating ? COLORS.warning : COLORS.border},
                      ]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingScoreHint}>
                {reviewRating === 5
                  ? '5/5 (Excellent)'
                  : reviewRating === 4
                  ? '4/5 (Good)'
                  : reviewRating === 3
                  ? '3/5 (Average)'
                  : reviewRating === 2
                  ? '2/5 (Poor)'
                  : '1/5 (Terrible)'}
              </Text>
            </View>

            {/* Multiline Text Area */}
            <TextInput
              style={styles.reviewTextInput}
              placeholder="Share your thoughts about this product..."
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={reviewInput}
              onChangeText={setReviewInput}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitReviewBtn,
                !reviewInput.trim() && styles.submitReviewBtnDisabled,
              ]}
              disabled={!reviewInput.trim()}
              onPress={handleSubmitReview}
              activeOpacity={0.8}>
              <Text style={styles.submitReviewBtnText}>Post Review</Text>
            </TouchableOpacity>
          </View>

          {/* Individual review cards */}
          {reviews.map((review, idx) => {
            const isEditing = editingReviewId === review.id;

            return (
              <View
                key={review.id}
                style={[
                  styles.reviewCard,
                  idx === reviews.length - 1 && {marginBottom: 0},
                  isEditing && styles.reviewCardEditing,
                ]}>
                {isEditing ? (
                  /* ─── In-place Edit Mode ─── */
                  <View style={styles.inplaceEditWrap}>
                    <View style={styles.inplaceHeader}>
                      <View style={styles.reviewNameRow}>
                        <Text style={styles.inplaceTitle}>✏️ Editing Your Review</Text>
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={handleCancelInplaceEdit}
                        style={styles.cancelInplaceBtn}
                        activeOpacity={0.7}
                        hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                        <Text style={styles.cancelInplaceText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Interactive Star Picker for In-place Edit */}
                    <View style={styles.inplaceRatingRow}>
                      <Text style={styles.inplaceRatingLabel}>Rating:</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => setEditRating(star)}
                            activeOpacity={0.7}
                            hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}>
                            <Text
                              style={[
                                styles.selectorStarChar,
                                {color: star <= editRating ? COLORS.warning : COLORS.border},
                              ]}>
                              ★
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={styles.inplaceRatingHint}>{editRating}/5</Text>
                    </View>

                    {/* Multiline Input for In-place Comment */}
                    <TextInput
                      style={styles.inplaceTextInput}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      placeholder="Update your review..."
                      placeholderTextColor={COLORS.muted}
                      value={editComment}
                      onChangeText={setEditComment}
                      autoFocus
                    />

                    {/* In-place Action Buttons */}
                    <View style={styles.inplaceActionsRow}>
                      <TouchableOpacity
                        onPress={handleCancelInplaceEdit}
                        style={styles.inplaceCancelBtn}
                        activeOpacity={0.7}>
                        <Text style={styles.inplaceCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSaveInplaceEdit(review.id)}
                        disabled={!editComment.trim()}
                        style={[
                          styles.inplaceSaveBtn,
                          !editComment.trim() && styles.submitReviewBtnDisabled,
                        ]}
                        activeOpacity={0.8}>
                        <Text style={styles.inplaceSaveBtnText}>Save Changes</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* ─── Standard Display Mode ─── */
                  <>
                    <View style={styles.reviewCardHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>{review.name.charAt(0)}</Text>
                      </View>
                      <View style={styles.reviewMeta}>
                        <View style={styles.reviewNameRow}>
                          <Text style={styles.reviewName}>{review.name}</Text>
                          {review.isUser && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>YOU</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Text
                              key={star}
                              style={[
                                styles.starChar,
                                {color: star <= review.rating ? COLORS.warning : COLORS.border},
                              ]}>
                              ★
                            </Text>
                          ))}
                        </View>
                      </View>
                      <View style={styles.reviewCardRightCol}>
                        <Text style={styles.reviewVerified}>✓ Verified</Text>
                        {review.isUser && (
                          <View style={styles.userActionsRow}>
                            <TouchableOpacity
                              onPress={() => handleStartInplaceEdit(review)}
                              style={styles.editReviewBtn}
                              activeOpacity={0.7}
                              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                              <Text style={styles.editReviewText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteReview(review.id)}
                              style={styles.deleteReviewBtn}
                              activeOpacity={0.7}
                              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                              <Text style={styles.deleteReviewText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Purchase Bar with insets */}
      <View style={[styles.bottomBar, {paddingBottom: Math.max(insets.bottom, 12)}]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.totalPriceLabel}>Price</Text>
          <Text style={styles.totalPriceVal}>
            ₹{(unitPrice * quantity).toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.buyNowBtn}
          activeOpacity={0.88}
          onPress={handleAdd}
          delayPressIn={0}>
          <Text style={styles.buyNowText}>Add to Bag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },

  // ── Top Bar ───────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    opacity: 0.65,
    resizeMode: 'contain',
  },
  headerIconActive: {
    opacity: 1,
  },
  backIcon: {
    width: 35,
    height: 35,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    maxWidth: '55%',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
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
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
  },

  // ── Hero Gallery ──────────────────────────
  scrollContent: {
    backgroundColor: COLORS.card,
  },
  heroWrap: {
    width: '100%',
    height: 340,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  heroWrapZoomed: {
    backgroundColor: '#FAFAFA',
  },
  heroInteractiveArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAnimatedBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit : "cover"

  },
  heroEmojiWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 90,
  },
  assuredBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  assuredText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },

  // ── Info Section ──────────────────────────
  infoSection: {
    padding: 16,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.subtext,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 8,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingPill: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  ratingVal: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    marginRight: 2,
  },
  ratingStar: {
    color: COLORS.white,
    fontSize: 9,
  },
  ratingCount: {
    fontSize: 12,
    color: COLORS.subtext,
  },

  priceContainer: {
    marginVertical: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
    marginRight: 8,
  },
  origPrice: {
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountTag: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.success,
  },
  taxInclusive: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 2,
  },

  // ── Options ───────────────────────────────
  optionSection: {
    marginTop: 14,
    marginBottom: 8,
  },
  sizeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  sizeChartLink: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.accent,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  multiplierHint: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.accent,
  },
  sizeBtn: {
    width: 48,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
  },
  sizeBtnActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  sizeText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
  },
  sizeTextActive: {
    color: COLORS.white,
  },
  sizeMultiplierText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    color: COLORS.subtext,
    marginTop: 1,
  },
  sizeMultiplierTextActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },

  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    backgroundColor: COLORS.cardSecondary,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperIcon: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  stepperVal: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 16,
  },

  // ── Perks ─────────────────────────────────
  perksContainer: {
    gap: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  perkTitle: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
  },
  perkSub: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 1,
  },

  // ── Description ───────────────────────────
  descBlock: {
    marginTop: 4,
  },
  descHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  descHeading: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  seeMoreBtn: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 20,
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 0,
    borderColor: COLORS.border,
  },
  seeMoreText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.accent,
  },
  descText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // ── Sticky Bottom Bar ─────────────────────
  bottomBar: {
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  bottomPriceCol: {
    flex: 1,
  },
  totalPriceLabel: {
    fontSize: 11,
    color: COLORS.subtext,
  },
  totalPriceVal: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
  },
  buyNowBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  buyNowText: {
    color: COLORS.white,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },

  // ── Customer Reviews (full-width) ─────────────────────
  reviewSection: {
    backgroundColor: COLORS.bg,
    marginTop: 8,
    paddingBottom: 28,
  },
  reviewHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  reviewHeading: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  reviewSeeAll: {
    fontSize: 13,
    color: COLORS.accent,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  reviewAvgRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 8,
    gap: 20,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  reviewAvgLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  reviewAvgScore: {
    fontSize: 52,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
    lineHeight: 58,
  },
  reviewAvgLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
    textAlign: 'center',
  },
  reviewAvgRight: {
    flex: 1,
    justifyContent: 'center',
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginBottom: 10,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  ratingBarLabel: {
    fontSize: 11,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    width: 24,
    textAlign: 'right',
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: COLORS.warning,
    borderRadius: 3,
  },
  starsRow: {
    flexDirection: 'row',
  },
  starChar: {
    fontSize: 14,
    lineHeight: 18,
  },
  starCharLg: {
    fontSize: 20,
    lineHeight: 24,
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  reviewAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  reviewMeta: {
    flex: 1,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    marginBottom: 3,
  },
  reviewVerified: {
    fontSize: 14,
    color: COLORS.success,
    fontFamily: 'Inter-Regular',
    fontWeight: '500',
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 21,
  },
  reviewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  youBadge: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  youBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: 0.5,
  },
  reviewCardRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  userActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  editReviewBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editReviewText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.accent,
  },
  deleteReviewBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteReviewText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#DC2626',
  },

  // ── In-place Review Editing Card ─────────────────────
  reviewCardEditing: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  inplaceEditWrap: {
    paddingVertical: 2,
  },
  inplaceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inplaceTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  cancelInplaceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cancelInplaceText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.subtext,
  },
  inplaceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  inplaceRatingLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
  },
  inplaceRatingHint: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.warning,
    marginLeft: 4,
  },
  inplaceTextInput: {
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
    minHeight: 70,
    marginBottom: 12,
  },
  inplaceActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  inplaceCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inplaceCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.textSecondary,
  },
  inplaceSaveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  inplaceSaveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.white,
  },

  // ── Write Review Form ────────────────────────────────
  writeReviewCard: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  writeReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  writeReviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  ratingSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  ratingSelectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
  },
  starsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectorStarChar: {
    fontSize: 22,
    lineHeight: 26,
  },
  ratingScoreHint: {
    fontSize: 12,
    color: COLORS.subtext,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  reviewTextInput: {
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
    minHeight: 80,
    marginBottom: 12,
  },
  submitReviewBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReviewBtnDisabled: {
    opacity: 0.5,
  },
  submitReviewBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});


