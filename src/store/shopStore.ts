import {useSyncExternalStore} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image?: string;
  qty: number;
  size?: string;
  priceForSize?: number;
};

export type WishlistItem = {
  id: number;
  name: string;
  price: number;
  image?: string;
  category?: string;
  rating?: number;
};

let activeUserId: string | null = null;
let isGuestMode: boolean = false;
let switchCounter = 0;

let cart: CartItem[] = [];
let wishlist: WishlistItem[] = [];
let cartCount = 0;
let persistReady = false;

const cartListeners = new Set<() => void>();
const wishlistListeners = new Set<() => void>();

function emitCart() {
  cartListeners.forEach(l => l());
}

function emitWishlist() {
  wishlistListeners.forEach(l => l());
}

function subscribeCart(listener: () => void) {
  cartListeners.add(listener);
  return () => {
    cartListeners.delete(listener);
  };
}

function subscribeWishlist(listener: () => void) {
  wishlistListeners.add(listener);
  return () => {
    wishlistListeners.delete(listener);
  };
}

function recomputeCartCount() {
  cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
}

function getCartKey(): string | null {
  if (activeUserId) return `APP_cart_user_${activeUserId}`;
  if (isGuestMode) return 'APP_cart_guest';
  return null;
}

function getWishlistKey(): string | null {
  if (activeUserId) return `APP_wishlist_user_${activeUserId}`;
  if (isGuestMode) return 'APP_wishlist_guest';
  return null;
}

function persistCart() {
  if (!persistReady) return;
  const key = getCartKey();
  if (!key) return;
  AsyncStorage.setItem(key, JSON.stringify(cart)).catch(() => {});
}

function persistWishlist() {
  if (!persistReady) return;
  const key = getWishlistKey();
  if (!key) return;
  AsyncStorage.setItem(key, JSON.stringify(wishlist)).catch(() => {});
}

export function getActiveShopUser() {
  return {activeUserId, isGuestMode};
}

export async function switchShopUser(userId: string | null, isGuest: boolean = false) {
  const currentToken = ++switchCounter;

  // 1. Immediately reset in-memory state so stale UI is NEVER shown
  cart = [];
  wishlist = [];
  cartCount = 0;
  activeUserId = userId;
  isGuestMode = isGuest;
  persistReady = false;

  emitCart();
  emitWishlist();

  // 2. Clean up when user is in guest mode
  /*if (isGuest) {
    persistReady = true;
    try {
      await Promise.all([
        AsyncStorage.removeItem('APP_cart_guest'),
        AsyncStorage.removeItem('APP_wishlist_guest'),
      ]);
    } catch {}
    return;
  }*/

  // 3. Unauthenticated / logged out (no user & not guest)
  if (!userId) {
    persistReady = false;
    return;
  }

  // 4. On login back - load stored data of respective signed user
  const userCartKey = `APP_cart_user_${userId}`;
  const userWishlistKey = `APP_wishlist_user_${userId}`;

  try {
    const [cartRaw, wishlistRaw] = await Promise.all([
      AsyncStorage.getItem(userCartKey),
      AsyncStorage.getItem(userWishlistKey),
    ]);

    if (currentToken !== switchCounter) return;

    let loadedCart: CartItem[] = [];
    let loadedWishlist: WishlistItem[] = [];

    if (cartRaw) {
      loadedCart = JSON.parse(cartRaw);
    } else {
      // Fallback legacy migration check
      const legacyCart = await AsyncStorage.getItem('APP_cart');
      if (legacyCart) {
        try {
          loadedCart = JSON.parse(legacyCart);
          AsyncStorage.setItem(userCartKey, legacyCart).catch(() => {});
          AsyncStorage.removeItem('APP_cart').catch(() => {});
        } catch {}
      }
    }

    if (wishlistRaw) {
      loadedWishlist = JSON.parse(wishlistRaw);
    } else {
      const legacyWishlist = await AsyncStorage.getItem('APP_wishlist');
      if (legacyWishlist) {
        try {
          loadedWishlist = JSON.parse(legacyWishlist);
          AsyncStorage.setItem(userWishlistKey, legacyWishlist).catch(() => {});
          AsyncStorage.removeItem('APP_wishlist').catch(() => {});
        } catch {}
      }
    }

    if (currentToken !== switchCounter) return;

    cart = Array.isArray(loadedCart) ? loadedCart : [];
    wishlist = Array.isArray(loadedWishlist) ? loadedWishlist : [];
    recomputeCartCount();
  } catch (err) {
    if (currentToken !== switchCounter) return;
    cart = [];
    wishlist = [];
    cartCount = 0;
  } finally {
    if (currentToken === switchCounter) {
      persistReady = true;
      emitCart();
      emitWishlist();
    }
  }
}

export async function hydrateShopStore(userId?: string | null, isGuest?: boolean) {
  if (userId !== undefined || isGuest !== undefined) {
    return switchShopUser(userId ?? null, !!isGuest);
  }
  persistReady = true;
}

export function addToCart(product: any) {
  const existing = cart.find(item => item.id === product.id && item.size === product.size);
  if (existing) {
    cart = cart.map(item =>
      item.id === product.id && item.size === product.size
        ? {...item, qty: item.qty + (product.qty ?? 1)}
        : item,
    );
  } else {
    cart = [
      ...cart,
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: product.qty ?? 1,
        size: product.size,
        priceForSize: product.priceForSize,
      },
    ];
  }
  recomputeCartCount();
  emitCart();
  persistCart();
}

export function removeFromCart(productId: number, size?: string) {
  cart = cart.filter(item => !(item.id === productId && item.size === size));
  recomputeCartCount();
  emitCart();
  persistCart();
}

export function updateQty(productId: number, qty: number, size?: string) {
  if (qty <= 0) {
    removeFromCart(productId, size);
    return;
  }
  cart = cart.map(item =>
    item.id === productId && item.size === size ? {...item, qty} : item,
  );
  recomputeCartCount();
  emitCart();
  persistCart();
}

export function clearCart(persist: boolean = false) {
  if (cart.length === 0) return;
  cart = [];
  cartCount = 0;
  emitCart();
  if (persist) {
    persistCart();
  }
}

export function clearWishlist(persist: boolean = false) {
  if (wishlist.length === 0) return;
  wishlist = [];
  emitWishlist();
  if (persist) {
    persistWishlist();
  }
}

export function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.priceForSize ?? item.price) * item.qty, 0);
}

export function addToWishlist(product: WishlistItem) {
  if (wishlist.some(item => item.id === product.id)) return;
  wishlist = [...wishlist, product];
  emitWishlist();
  persistWishlist();
}

export function removeFromWishlist(productId: number) {
  const next = wishlist.filter(item => item.id !== productId);
  if (next.length === wishlist.length) return;
  wishlist = next;
  emitWishlist();
  persistWishlist();
}

export function toggleWishlist(product: WishlistItem) {
  if (wishlist.some(item => item.id === product.id)) {
    removeFromWishlist(product.id);
  } else {
    addToWishlist(product);
  }
}

export function useCart() {
  return useSyncExternalStore(subscribeCart, () => cart);
}

export function useCartCount() {
  return useSyncExternalStore(subscribeCart, () => cartCount);
}

export function useWishlist() {
  return useSyncExternalStore(subscribeWishlist, () => wishlist);
}

export function useWishlistCount() {
  return useSyncExternalStore(subscribeWishlist, () => wishlist.length);
}

export function useIsWishlisted(productId: number) {
  return useSyncExternalStore(subscribeWishlist, () =>
    wishlist.some(item => item.id === productId),
  );
}
