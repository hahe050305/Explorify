import React, {useState, useMemo, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  Dimensions,
  TextInput,
  Image,
  StatusBar,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import COLORS from '../constants/colors';
import {useAuth} from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import {useGlobalProducts} from '../context/ProductContext';
import {CartCountBadge, WishlistCountBadge} from '../components/CountBadge';
import ComboSection from './ComboSection';
import {
  addToCart,
  toggleWishlist,
  removeFromWishlist,
  useIsWishlisted,
  useWishlist,
  switchShopUser,
} from '../store/shopStore';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  rating?: number;
};

type Props = { navigation: any };

// ── Memoized Product Card for zero-delay taps & instant badge updates ──
const ProductCard = React.memo(function ProductCard({
  item,
  cardWidth,
  onPressProduct,
}: {
  item: Product;
  cardWidth: number;
  onPressProduct: (item: Product) => void;
}) {
  const isWishlisted = useIsWishlisted(item.id);
  const isUri = typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('data:'));
  const displayRating = item.rating ? item.rating.toFixed(1) : (4.3 + (((item.id || 1) % 6) * 0.1)).toFixed(1);
  const mrp = (item.price * 1.35).toFixed(2);
  const discountPercent = Math.round(((item.price * 1.35 - item.price) / (item.price * 1.35)) * 100);

  return (
    <TouchableOpacity
      style={[styles.card, {width: cardWidth}]}
      activeOpacity={0.88}
      delayPressIn={0}
      onPress={() => onPressProduct(item)}>
      <View style={styles.imageContainer}>
        {isUri ? (
          <Image source={{uri: item.image}} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.emojiWrapper}>
            <Text style={styles.emoji}>{item.image || '🛍️'}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.wishlistBtn}
          activeOpacity={0.7}
          delayPressIn={0}
          onPress={() => toggleWishlist({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            rating: item.rating,
          })}>
          <Image
            source={require('../images/icon-wishlist.jpg')}
            style={[styles.cardWishlistIcon, isWishlisted && styles.cardWishlistIconActive]}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingValue}>{displayRating}</Text>
          <Text style={styles.ratingStar}>★</Text>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.categoryTag} numberOfLines={1}>{item.category.toUpperCase()}</Text>
        <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            <Text style={styles.originalPrice}>₹{mrp}</Text>
          </View>
          <Text style={styles.discountTag}>{discountPercent}% OFF</Text>
        </View>
        <TouchableOpacity
          style={styles.cardAddBtn}
          activeOpacity={0.8}
          delayPressIn={0}
          onPress={() => addToCart({ id: item.id, name: item.name, price: item.price, image: item.image })}>
          <Text style={styles.cardAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

function WishlistSheet({
  visible,
  insetsBottom,
  navigation,
  onClose,
}: {
  visible: boolean;
  insetsBottom: number;
  navigation: any;
  onClose: () => void;
}) {
  const wishlist = useWishlist();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.wishlistSheet, {paddingBottom: Math.max(insetsBottom, 16)}]} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>♥ Wishlist ({wishlist.length})</Text>
            <TouchableOpacity onPress={onClose} delayPressIn={0}>
              <Text style={styles.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {wishlist.length === 0 ? (
            <View style={styles.wishlistEmpty}>
              <Text style={styles.wishlistEmptyIcon}>♡</Text>
              <Text style={styles.wishlistEmptyText}>Your wishlist is empty</Text>
              <Text style={styles.wishlistEmptySubText}>Tap ♡ on any product to save it here</Text>
            </View>
          ) : (
            <FlatList
              data={wishlist}
              keyExtractor={i => String(i.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 8}}
              initialNumToRender={8}
              windowSize={5}
              renderItem={({item}) => {
                const isUri = typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('data:'));
                return (
                  <TouchableOpacity
                    style={styles.wishlistRow}
                    activeOpacity={0.85}
                    delayPressIn={0}
                    onPress={() => {
                      onClose();
                      navigation.navigate('ProductDetails', { product: item });
                    }}>
                    <View style={styles.wishlistThumb}>
                      {isUri ? (
                        <Image source={{uri: item.image}} style={styles.wishlistThumbImg} resizeMode="cover" />
                      ) : (
                        <Text style={{fontSize: 24}}>🛍️</Text>
                      )}
                    </View>
                    <View style={styles.wishlistInfo}>
                      <Text style={styles.wishlistItemName} numberOfLines={2}>{item.name}</Text>
                      {item.category && <Text style={styles.wishlistItemCat}>{item.category}</Text>}
                      <Text style={styles.wishlistItemPrice}>₹{Number(item.price).toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.wishlistRemoveBtn}
                      onPress={() => removeFromWishlist(item.id)}
                      activeOpacity={0.7}
                      delayPressIn={0}>
                      <Text style={styles.wishlistRemoveIcon}>♥</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function HomeScreen({navigation}: Props) {
  const insets = useSafeAreaInsets();
  const { user, isGuest } = useAuth();

  // Derive stable identifier strictly per signed user
  const currentUserId = user?.id || user?.email || (user?.username ? `user_${user.username}` : null);

  // Strictly tie wishlist & cart notifications to active user, clean up in guest mode, and restore on login back
  useEffect(() => {
    if (isGuest) {
      switchShopUser(null, true);
    } else if (currentUserId) {
      switchShopUser(currentUserId, false);
    } else {
      switchShopUser(null, false);
    }
  }, [currentUserId, isGuest]);

  const { location, requestLocation } = useLocation();

  useEffect(() => {
    requestLocation();
  }, []);

  const { products, categories, loading, refreshProducts } = useGlobalProducts();

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'combo' | 'cart' | 'profile' | 'wishlist'>('home');
  const [wishlistVisible, setWishlistVisible] = useState(false);

  const currentIndexRef = useRef(0);
  const carouselScrollRef = useRef<any>(null);

  // Featured carousel products
  const carouselProducts = useMemo(() => {
    if (products.length === 0) return [];
    return products.slice(0, 7);
  }, [products]);

  // Auto-advance carousel timer with smooth intervals
  useEffect(() => {
    carouselProducts.forEach(p => {
      if (p.image && typeof p.image === 'string' && (p.image.startsWith('http') || p.image.startsWith('data:'))) {
        Image.prefetch(p.image);
      }
    });

    if (carouselProducts.length <= 1) return;

    const timer = setInterval(() => {
      const next = (currentIndexRef.current + 1) % carouselProducts.length;
      if (carouselScrollRef.current) {
        try {
          carouselScrollRef.current.scrollToIndex({ index: next, animated: true });
        } catch {
          carouselScrollRef.current.scrollToOffset({ offset: next * SCREEN_W, animated: true });
        }
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [carouselProducts]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, selectedCategory, searchQuery]);

  const cardWidth = useMemo(() => Math.floor((SCREEN_W - 16 * 2 - 12) / 2), []);

  const handlePressProduct = React.useCallback((item: Product) => {
    navigation.navigate('ProductDetails', { product: item });
  }, [navigation]);

  const renderProduct = React.useCallback(({item}: {item: Product}) => (
    <ProductCard
      item={item}
      cardWidth={cardWidth}
      onPressProduct={handlePressProduct}
    />
  ), [cardWidth, handlePressProduct]);

  const navBarHeight = 60 + insets.bottom;
  const carouselItemWidth = SCREEN_W;

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" {...(Platform.OS === 'android' ? {backgroundColor: '#FFFFFF', translucent: false} : {})} />
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Exploring your fav products...</Text>
          <Text style={styles.loaderSubtext}>Curating the latest collections for you</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <StatusBar
        barStyle="dark-content"
        {...(Platform.OS === 'android' ? {backgroundColor: '#FFFFFF', translucent: false} : {})}
      />

      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>Explorify</Text>
            <View style={styles.storeBadge}>
              <Text style={styles.storeBadgeText}>ASSURED</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            delayPressIn={0}
            onPress={() => requestLocation()}>
            <Text style={styles.deliveryLocation} numberOfLines={1}>
              {`Deliver to ${user?.username ?? 'Guest'}, ${location.address ?? 'Select Address'}`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.cartHeaderBtn}
            activeOpacity={0.7}
            delayPressIn={0}
            onPress={() => setWishlistVisible(true)}>
            <Image source={require('../images/icon-wishlist.jpg')} style={[styles.navIcon, activeTab === 'wishlist' && styles.navIconActive]} />
            <WishlistCountBadge />
          </TouchableOpacity>
        </View>
      </View>


      {activeTab !== 'combo' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Image source={require('../images/icon-search.jpg')} style={styles.searchIcon} resizeMode="contain" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products, brands, essentials..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}


      <View style={{ flex: 1 }}>
        {activeTab === 'combo' ? (
          <ComboSection />
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={i => i.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: navBarHeight + 20 }]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={7}
            updateCellsBatchingPeriod={16}
            removeClippedSubviews={Platform.OS === 'android'}
            ListHeaderComponent={
              <>
                {!searchQuery && carouselProducts.length > 0 && (
                  <View style={styles.carouselContainer}>
                    <FlatList
                      ref={carouselScrollRef}
                      data={carouselProducts}
                      horizontal
                      pagingEnabled
                      snapToInterval={carouselItemWidth}
                      snapToAlignment="start"
                      decelerationRate="fast"
                      disableIntervalMomentum={true}
                      showsHorizontalScrollIndicator={false}
                      removeClippedSubviews={false}
                      initialNumToRender={5}
                      maxToRenderPerBatch={5}
                      windowSize={5}
                      keyExtractor={p => p.id.toString()}
                      getItemLayout={(_, index) => ({
                        length: carouselItemWidth,
                        offset: carouselItemWidth * index,
                        index,
                      })}
                      scrollEventThrottle={32}
                      onMomentumScrollEnd={e => {
                        const offset = e.nativeEvent.contentOffset.x;
                        const index = Math.round(offset / carouselItemWidth);
                        if (index >= 0 && index < carouselProducts.length) {
                          currentIndexRef.current = index;
                        }
                      }}
                      renderItem={({ item: p, index }) => {
                        const isUri = typeof p.image === 'string' && (p.image.startsWith('http') || p.image.startsWith('data:'));
                        const discount = 25 + ((p.id * 7) % 25);
                        const promoBadges = ['MEGA DEAL', 'TOP SELLER', 'TRENDING', 'LIMITED OFFER', 'BEST VALUE'];
                        const badgeLabel = promoBadges[index % promoBadges.length];
                        return (
                          <TouchableOpacity
                            style={[styles.carouselSlide, { width: carouselItemWidth }]}
                            activeOpacity={0.92}
                            delayPressIn={0}
                            onPress={() => navigation.navigate('ProductDetails', { product: p })}>
                            <View style={styles.carouselSlideInner}>
                              <View style={styles.carouselImageWrap}>
                                {isUri ? (
                                  <Image source={{ uri: p.image }} style={styles.carouselImage} resizeMode="cover" />
                                ) : (
                                  <View style={styles.carouselEmojiWrap}>
                                    <Text style={styles.carouselEmoji}>{p.image || '🛍️'}</Text>
                                  </View>
                                )}
                                <View style={styles.carouselBadge}>
                                  <Text style={styles.carouselBadgeText}>{badgeLabel}</Text>
                                </View>
                                <View style={styles.carouselDiscountBubble}>
                                  <Text style={styles.carouselDiscountText}>{discount}% OFF</Text>
                                </View>
                              </View>
                              <View style={styles.carouselCaptionWrap}>
                                <View style={{ flex: 1, marginRight: 8, justifyContent: 'center' }}>
                                  <Text style={styles.carouselCategory} numberOfLines={1}>{p.category.toUpperCase()}</Text>
                                    <Text style={styles.carouselPrice}>₹{p.price.toFixed(2)}</Text>
                                  <Text style={styles.carouselTitle} numberOfLines={1}>{p.name}</Text>
                                  <View style={styles.carouselPriceRow}>
                                    {/* <Text style={styles.carouselMrp}>${(p.price * 1.35).toFixed(2)}</Text> */}
                                    <Text style={styles.carouselRating}>★ {p.rating ? Number(p.rating).toFixed(1) : (4.3 + (((p.id || 1) % 6) * 0.1)).toFixed(1)}</Text>
                                  </View>
                                </View>
                                <TouchableOpacity
                                  // style={styles.carouselCtaBtn}
                                  activeOpacity={0.8}
                                  delayPressIn={0}
                                  onPress={() => navigation.navigate('ProductDetails', { product: p })}>
                                  {/* <Text style={styles.carouselCtaText}>Shop Now →</Text> */}
                                </TouchableOpacity>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                )}
                <View style={styles.categoriesSection}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
                    {categories.map(cat => {
                      const active = selectedCategory.toLowerCase() === cat.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.categoryPill, active && styles.categoryPillActive]}
                          onPress={() => setSelectedCategory(cat)}
                          activeOpacity={0.7}>
                          <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <View style={styles.feedHeader}>
                  <Text style={styles.feedTitle}>
                    {searchQuery ? `Search Results for "${searchQuery}"` : (selectedCategory === 'All' ? 'Popular Picks' : selectedCategory)}
                  </Text>
                  <Text style={styles.feedCount}>{filteredProducts.length} items</Text>
                </View>
              </>
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyHeading}>No products found</Text>
                <Text style={styles.emptyText}>Try searching with different keywords or browse our categories.</Text>
                <TouchableOpacity
                  style={styles.browseAllBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}>
                  <Text style={styles.browseAllText}>View All Products</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <View style={[styles.navbar, {paddingBottom: Math.max(insets.bottom, 8)}]}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} delayPressIn={0} onPress={() => { setActiveTab('home'); setSearchQuery(''); }}>
          <Image source={require('../images/icon-home.jpg')} style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]} />
          <Text style={[styles.navTitle, activeTab === 'home' && styles.navTitleActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} delayPressIn={0} onPress={() => { setActiveTab('combo'); setSearchQuery(''); }}>
          <Image source={require('../images/icon-combo.jpg')} style={[styles.navIcon, activeTab === 'combo' && styles.navIconActive]} />
          <Text style={[styles.navTitle, activeTab === 'combo' && styles.navTitleActive]}>Combo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} delayPressIn={0} onPress={() => navigation.navigate('Cart')}>
          <View style={styles.navCartWrap}>
            <Image source={require('../images/icon-cart.jpg')} style={[styles.navIcon, activeTab === 'cart' && styles.navIconActive]} />
            <CartCountBadge />
          </View>
          <Text style={styles.navTitle}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} delayPressIn={0} onPress={() => navigation.navigate('Profile')}>
          <Image source={require('../images/icon-account.jpg')} style={styles.navIcon} />
          <Text style={styles.navTitle}>Account</Text>
        </TouchableOpacity>
      </View>

      <WishlistSheet
        visible={wishlistVisible}
        insetsBottom={insets.bottom}
        navigation={navigation}
        onClose={() => setWishlistVisible(false)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Top Header ────────────────────────────
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
  headerLeft: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  storeBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  storeBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: 0.5,
  },
  deliveryLocation: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartHeaderBtn: {
    padding: 8,
    position: 'relative',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIconText: {
    fontSize: 18,
  },
  cartCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cartCountText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
  },

  // ── Search Section ────────────────────────
  searchContainer: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "black",
  },
  searchIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.subtext,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.subtext,
  },

  // ── Dynamically Changing Top Ad Carousel ──
  carouselContainer: {
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 0,

  },
  carouselScroll: {
    // No horizontal padding here — slides must fill full SCREEN_W for perfect pagingEnabled snapping
  },
  carouselSlide: {
    backgroundColor: 'transparent',
    overflow: 'visible',
    paddingHorizontal: 0,
    paddingTop: 0,
    //paddingBottom:0,
    height: 320,
  },
  carouselSlideInner: {
    height: 320,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    flexDirection: 'column',
  },
  carouselImageWrap: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.cardSecondary,
    overflow : 'hidden'
    // position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // ← fit the whole image, don't crop

  },
  carouselEmojiWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    //alignItems: 'center',
  },
  carouselEmoji: {
    fontSize: 60,
  },
  carouselBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  carouselBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    letterSpacing: 0.5,
  },
  carouselDiscountBubble: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  carouselDiscountText: {
    color: COLORS.white,
    fontSize: 11,
    //fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
  },
  carouselCaptionWrap: {
    height: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    flex: 0,
  },
  carouselCategory: {
    fontSize: 14,
    lineHeight: 12,
    fontWeight: '800',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.accent,
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign : 'center',
  },
  carouselTitle: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700',
    fontFamily: 'Inter-Medium',
    color: COLORS.text,
    marginRight: 2,
    textAlign : 'center',
  },
  carouselPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    height: 22,
    justifyContent: 'space-between',
  },
  carouselPrice: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
    marginLeft: 2,
  },
  carouselMrp: {
    fontSize: 12,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
    marginRight: 8,
    marginTop : 4
  },
  carouselRating: {
    fontSize: 17,
    color: COLORS.success,
    fontWeight: '700',
    fontFamily: 'Inter-ExtraBold',
    marginTop : 0

  },
  carouselCtaBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 20,
  },
  carouselCtaText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  carouselDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
    gap: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: COLORS.text,
  },

  // ── Categories Row ────────────────────────
  categoriesSection: {
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-Bold',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  loaderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    width: '100%',
    maxWidth: 320,
  },
  loaderText: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  loaderSubtext: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.subtext,
    textAlign: 'center',
  },

  // ── Feed Header ───────────────────────────
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    //alignItems : 'center',
  },
  feedCount: {
    fontSize: 17,
    color: COLORS.subtext,
  },

  // ── Product Grid ──────────────────────────
  scrollContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    paddingHorizontal: 11,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    width: '100%',
    height: '150',
    backgroundColor: COLORS.cardSecondary,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  emojiWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingValue: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    marginRight: 2,
  },
  ratingStar: {
    color: COLORS.white,
    fontSize: 8,
  },
  cardInfo: {
    padding: 10,
  },
  categoryTag: {
    fontSize: 9,
    color: COLORS.subtext,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: COLORS.text,
    lineHeight: 17,
    minHeight: 34,
  },
  priceContainer: {
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 11,
    color: COLORS.muted,
    textDecorationLine: 'line-through',
  },
  discountTag: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.success,
    marginTop: 1,
  },
  cardAddBtn: {
    marginTop: 8,
    backgroundColor: COLORS.cardSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
  },
  cardAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },

  // ── Empty State ───────────────────────────
  emptyWrap: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.subtext,
    textAlign: 'center',
    marginBottom: 16,
  },
  browseAllBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  browseAllText: {
    color: COLORS.white,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  // ── Fixed Bottom Navigation Bar ───────────
  navbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    opacity: 0.55,
    resizeMode: 'contain',
  },
  navIconActive: {
    opacity: 1,
  },
  navTitle: {
    fontSize: 10,
    color: COLORS.subtext,
    marginTop: 3,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  navTitleActive: {
    color: COLORS.text,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  navCartWrap: {
    position: 'relative',
  },
  navBadge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: COLORS.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  navBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
  },

  // ── Wishlist Heart Button on Card ─────────
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 3,
  },
  wishlistHeart: {
    fontSize: 20,
    color: '#aaa',
    lineHeight: 18,
  },
  wishlistHeartActive: {
    color: '#E53935',
  },
  cardWishlistIcon: {
    width: 16,
    height: 16,
    borderRadius: 3,
    opacity: 0.5,
    resizeMode: 'contain',
  },
  cardWishlistIconActive: {
    opacity: 1,
  },

  placeholderText: { marginTop: 12, fontSize: 16, color: '#555', fontWeight: '500',
    fontFamily: 'Inter-Medium' },

  // ── Wishlist Modal Sheet ───────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  wishlistSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_H * 0.72,
    minHeight: 220,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  sheetClose: {
    fontSize: 16,
    color: COLORS.muted,
    paddingHorizontal: 4,
  },

  // Empty state
  wishlistEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  wishlistEmptyIcon: {
    fontSize: 48,
    color: '#ccc',
    marginBottom: 10,
  },
  wishlistEmptyText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    marginBottom: 4,
  },
  wishlistEmptySubText: {
    fontSize: 12,
    color: COLORS.subtext,
  },

  // Wishlist row item
  wishlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  wishlistThumb: {
    width: 60,
    height: 68,
    borderRadius: 8,
    backgroundColor: COLORS.cardSecondary,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  wishlistThumbImg: {
    width: '100%',
    height: '100%',
  },
  wishlistInfo: {
    flex: 1,
  },
  wishlistItemName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
    lineHeight: 18,
  },
  wishlistItemCat: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 2,
    },
  wishlistItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.text,
    marginTop: 4,
  },
  wishlistRemoveBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  wishlistRemoveIcon: {
    fontSize: 20,
    color: '#E53935',
  },
});

