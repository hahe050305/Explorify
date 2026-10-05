// src/screens/RegisterScreen.tsx
// ─────────────────────────────────────────────────────────
// Registration screen for new users
// Minimal onboarding with username and email
// ─────────────────────────────────────────────────────────

import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import COLORS from '../constants/colors';
import {useAuth} from '../context/AuthContext';
import {useAlert} from '../context/AlertContext';

type Props = {
  navigation: any;
};

type FormErrors = {
  username?: string;
  email?: string;
  password?: string;
};

export default function RegisterScreen({navigation}: Props) {
  const {signUp} = useAuth();
  const {showAlert} = useAlert();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = 'Invalid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    } else if (password !== confirmPassword) {
      newErrors.password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await signUp(username, email, password);
      showAlert({
        title: 'Account Created',
        message: 'Welcome to Explorify! Your account was created successfully.',
        type: 'success',
        buttons: [
          {
            text: 'Explore Store',
            onPress: () => navigation.navigate('Home'),
          },
        ],
      });
    } catch (err: any) {
      showAlert({
        title: 'Registration Failed',
        message: err?.message || 'Failed to create account. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Ambient Blended Minimalist Background Blobs */}
      <View style={styles.ambientBackgroundContainer} pointerEvents="none">
        <View style={styles.ambientBlobTopLeft} />
        <View style={styles.ambientBlobTopRight} />
        <View style={styles.ambientBlobCenter} />
        <View style={styles.ambientBlobBottomRight} />
      </View>

      <View style={styles.scroll}>

        {/* Card Glow Aura Wrapper for visible blended minimalist halo */}
        <View style={styles.cardOuterWrapper}>
          <View style={styles.cardGlowAuraTop} pointerEvents="none" />
          <View style={styles.cardGlowAuraBottom} pointerEvents="none" />
          <View style={styles.cardGlowAuraRight} pointerEvents="none" />

          <View style={styles.card}>

            {/* Explorify SaaS Brand Header with Minimalist Backdrop */}
            <View style={styles.brandHeroContainer}>
              <View style={styles.brandGlowBackdrop} />
              <View style={styles.brandLogoRow}>
                <View style={styles.brandIconBox}>
                  <Text style={styles.brandIconText}>⚡</Text>
                </View>
                <Text style={styles.brandTitle}>Explorify</Text>
              </View>
              <Text style={styles.brandTagline}>Your Shopping Paradise </Text>
            </View>

          {/* Heading */}
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subheading}>Join us to start shopping</Text>

          {/* Username field */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[
                styles.input,
                errors.username ? styles.inputError : null,
              ]}
              value={username}
              onChangeText={text => {
                setUsername(text);
                if (errors.username) setErrors(e => ({...e, username: undefined}));
              }}
              placeholder="Choose a username"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
          </View>

          {/* Email field */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={[
                styles.input,
                errors.email ? styles.inputError : null,
              ]}
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (errors.email) setErrors(e => ({...e, email: undefined}));
              }}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Password field */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={[
              styles.input,
              styles.passwordWrap,
              errors.password ? styles.inputError : null,
            ]}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  if (errors.password) setErrors(e => ({...e, password: undefined}));
                }}
                placeholder="••••••••••"
                placeholderTextColor={COLORS.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(v => !v)}
                activeOpacity={0.6}
                style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password field */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                errors.password ? styles.inputError : null,
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••••"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Register button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={loading}>
            <Text style={styles.primaryBtnText}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </View>
        {/* end card */}
      </View>
      {/* end cardOuterWrapper */}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Crisp soft SaaS slate background
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Blended Minimalist Ambient Mesh Background ──────────── 
  ambientBackgroundContainer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  ambientBlobTopLeft: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#C7D2FE', // Rich pastel indigo
    opacity: 0.85,
  },
  ambientBlobTopRight: {
    position: 'absolute',
    top: 50,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#BAE6FD', // Rich pastel sky blue
    opacity: 0.85,
  },
  ambientBlobCenter: {
    position: 'absolute',
    top: '32%',
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#DDD6FE', // Rich pastel violet
    opacity: 0.75,
  },
  ambientBlobBottomRight: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FBCFE8', // Soft pastel rose / blush
    opacity: 0.7,
  },

  scroll: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  // ── Blended Minimalist Halo Aura around Pop-Up Card ──────
  cardOuterWrapper: {
    position: 'relative',
    borderRadius: 30,
  },
  cardGlowAuraTop: {
    position: 'absolute',
    top: -14,
    left: 20,
    right: 20,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#818CF8', // Indigo glow
    opacity: 0.35,
  },
  cardGlowAuraBottom: {
    position: 'absolute',
    bottom: -14,
    left: 25,
    right: 25,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#38BDF8', // Cyan/Sky glow
    opacity: 0.35,
  },
  cardGlowAuraRight: {
    position: 'absolute',
    top: 60,
    bottom: 60,
    right: -12,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#C084FC', // Purple glow
    opacity: 0.3,
  },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#4338CA',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  // ── Explorify SaaS Brand Header ──────────────────────────
  brandHeroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  brandGlowBackdrop: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E0E7FF',
    opacity: 0.5,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 7,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  brandIconText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Inter-Black',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  saasBadge: {
    marginLeft: 8,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  saasBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    fontFamily: 'Inter-ExtraBold',
    color: '#475569',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginTop: 2,
  },

  heading: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.3,
  },

  subheading: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },

  fieldWrap: {
    marginBottom: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: COLORS.text,
    marginBottom: 5,
  },

  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.subtext,
    width: '100%',
  },

  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },

  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 5,
  },

  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.subtext,
  },

  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  eyeIcon: {
    fontSize: 15,
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },

  btnDisabled: {
    opacity: 0.6,
  },

  primaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginText: {
    fontSize: 13,
    color: COLORS.subtext,
  },

  loginLink: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.primary,
  },
});

