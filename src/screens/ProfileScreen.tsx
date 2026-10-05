import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {useGlobalProducts} from '../context/ProductContext';
import {customAlert} from '../context/AlertContext';
import COLORS from '../constants/colors';

export default function ProfileScreen({navigation}: any) {
  const insets = useSafeAreaInsets();
  const {user, isGuest, logout} = useAuth();
  const {resetProductFetch} = useGlobalProducts();

  const handleLogout = () => {
    customAlert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', onPress: () => {}, style: 'cancel'},
      {
        text: 'Sign Out',
        onPress: () => {
          resetProductFetch();
          logout();
          navigation.navigate('Login');
        },
        style: 'destructive',
      },
    ]);
  };

  const displayName = user?.username ? user.username : (isGuest ? 'Guest Shopper' : 'User');
  const initial = displayName.charAt(0).toUpperCase();

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
        <Text style={styles.topHeader}>My Account</Text>
        <View style={{width: 36}} />
      </View>

      <View style={[styles.content, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={[styles.badgePill, isGuest && styles.guestBadgePill]}>
              <Text style={[styles.badgeText, isGuest && styles.guestBadgeText]}>
                {isGuest ? 'GUEST USER' : 'EXPLORIFY MEMBER'}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Info Details */}
        <View style={styles.cardGroup}>
          <Text style={styles.groupLabel}>ACCOUNT DETAILS</Text>

          <View style={styles.infoTile}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{displayName}</Text>
          </View>

          {user?.email && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoTile}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </>
          )}
        </View>

        {isGuest && (
          <TouchableOpacity
            style={styles.registerBanner}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}>
            <View>
              <Text style={styles.registerBannerTitle}>Unlock Full Membership</Text>
              <Text style={styles.registerBannerSub}>Track orders, manage addresses & save favorites</Text>
            </View>
            {/* <Text style={styles.registerArrow}>→</Text> */}
          </TouchableOpacity>
        )}

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}>
          <Text style={styles.signOutText}>{isGuest ? 'Exit Guest Mode' : 'Sign Out'}</Text>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    // borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    fontFamily: 'Inter-ExtraBold',
    fontSize: 22,
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
  content: {
    flex: 1,
    padding: 16,
  },

  // ── User Card ─────────────────────────────
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  badgePill: {
    backgroundColor: COLORS.successLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.success,
    letterSpacing: 0.4,
  },
  guestBadgePill: {
    backgroundColor: COLORS.warningLight,
  },
  guestBadgeText: {
    color: COLORS.warning,
  },

  // ── Info Group ────────────────────────────
  cardGroup: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: COLORS.subtext,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoTile: {
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.subtext,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 8,
  },

  // ── Register Banner ───────────────────────
  registerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginBottom: 16,
  },
  registerBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },
  registerBannerSub: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 2,
  },
  registerArrow: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.accent,
    marginLeft: 8,
  },

  // ── Sign Out Button ───────────────────────
  signOutBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  signOutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    fontSize: 13,
  },
});


