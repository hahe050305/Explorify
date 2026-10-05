// src/screens/auth/LoginScreen.tsx
// ─────────────────────────────────────────────────────────
// Login screen — React Native CLI
// Mirrors screen-2 minimal layout adapted for mobile
// Guest mode toggle + form validation included
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
  Switch,
  Modal,
} from 'react-native';
import COLORS from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';

// ─── Types ───────────────────────────────────────────────
type FormErrors = {
  email?: string;
  password?: string;
};

// ─── Props ───────────────────────────────────────────────
// swap `any` with your navigation type once you set up React Navigation
type Props = {
  navigation: any;
};

// ─────────────────────────────────────────────────────────
export default function LoginScreen({navigation}: Props) {

  // form state
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSigned, setKeepSigned] = useState(false);
  const [guestMode, setGuestMode]   = useState(false);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [emailFocused, setEmailFocused]       = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // ── validation ───────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!email.includes('@')) {
      newErrors.email = "Invalid email";
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password needs at least 4 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auth
  const { signIn, signInAsGuest, resetPassword: authResetPassword } = useAuth();
  const { showAlert } = useAlert();

  // ── handlers ─────────────────────────────────────────
  const handleSignIn = async () => {
    if (!validate()) return;
    try {
      await signIn(email.trim(), password, keepSigned);
      navigation.navigate('Home');
    } catch (err: any) {
      showAlert({
        title: 'Login Failed',
        message: err?.message || 'No account found with these credentials. Please register first.',
        type: 'error',
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      showAlert({
        title: 'Missing Email',
        message: 'Please enter your registered email address.',
        type: 'warning',
      });
      return;
    }
    if (!resetEmail.includes('@')) {
      showAlert({
        title: 'Invalid Email',
        message: 'Please enter a valid email address format.',
        type: 'warning',
      });
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      showAlert({
        title: 'Password Mismatch',
        message: 'The new passwords do not match. Please re-enter them.',
        type: 'warning',
      });
      return;
    }
    if (resetPassword.length < 4) {
      showAlert({
        title: 'Password Too Short',
        message: 'Password must be at least 4 characters long.',
        type: 'warning',
      });
      return;
    }

    try {
      await authResetPassword(resetEmail, resetPassword);
      showAlert({
        title: 'Password Reset',
        message: 'Your password has been reset successfully! Please log in with your new password.',
        type: 'success',
      });
      setForgotPasswordVisible(false);
      setResetEmail('');
      setResetPassword('');
      setResetConfirmPassword('');
    } catch (err: any) {
      showAlert({
        title: 'Reset Failed',
        message: err?.message || 'Failed to reset password. Please try again.',
        type: 'error',
      });
    }
  };

  const handleGuestEntry = () => {
    signInAsGuest();
  };

  const handleGoogleSignIn = () => {
    // TODO: Supabase OAuth — Google
    showAlert({
      title: 'Google Sign-In',
      message: 'Google authentication is coming soon.',
      type: 'info',
    });
  };

  const handleGitHubSignIn = () => {
    // TODO: Supabase OAuth — GitHub
    showAlert({
      title: 'GitHub Sign-In',
      message: 'GitHub authentication is coming soon.',
      type: 'info',
    });
  };

  // ─────────────────────────────────────────────────────
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

          {/* ── card ───────────────────────────────────── */}
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
              <Text style={styles.brandTagline}>Explore the Exclusive</Text>
            </View>

          {/* Heading */}
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your store dashboard</Text>

          {/* Guest CTA as a normal button (below Sign in) - removed toggle */}

          {/* ── form — dimmed when guest mode is on ── */}
          <View style={{opacity: guestMode ? 0.35 : 1}}
            pointerEvents={guestMode ? 'none' : 'auto'}>

            {/* email field */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused,
                  errors.email ? styles.inputError : null,
                ]}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (errors.email) setErrors(e => ({...e, email: undefined}));
                }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="explorify@gmail.com"
                placeholderTextColor={COLORS.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* password field */}
            <View style={styles.fieldWrap}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setForgotPasswordVisible(true)}>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <View style={[
                styles.input,
                styles.passwordWrap,
                passwordFocused && styles.inputFocused,
                errors.password ? styles.inputError : null,
              ]}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (errors.password) setErrors(e => ({...e, password: undefined}));
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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

              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* keep me signed in */}
            {/* <View style={styles.keepSignedRow}> */}
              {/* <Switch */}
                {/* value={keepSigned} */}
                {/* onValueChange={setKeepSigned} */}
                {/* thumbColor={COLORS.white} */}
                {/* trackColor={{ */}
                  {/* false: COLORS.border, */}
                  {/* true: COLORS.primary, */}
                {/* }} */}
                {/* style={styles.keepSwitch} */}
              {/* /> */}
              {/* <Text style={styles.keepText}>Keep me signed in</Text> */}
            {/* </View> */}

            {/* sign in CTA */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSignIn}
              activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Sign in</Text>
            </TouchableOpacity>

            {/* guest button placed below sign-in */}
            <TouchableOpacity
              style={[styles.guestBtn, {marginTop:12}]}
              onPress={() => { 
                handleGuestEntry(); 
                // Brief delay to ensure state updates before navigation
                setTimeout(() => {
                  navigation.navigate('Home');
                }, 100);
              }}
              activeOpacity={0.85}>
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>

            {/* divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleGoogleSignIn}
                activeOpacity={0.7}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                onPress={handleGitHubSignIn}
                activeOpacity={0.7}>
                {/* using text symbol — no icon lib needed */}
                <Text style={styles.socialIcon}>⌥</Text>
                <Text style={styles.socialText}>GitHub</Text>
              </TouchableOpacity>
            </View>

          </View>
          {/* end form dimming wrapper */}

          {/* register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}>
              <Text style={styles.registerLink}>Register now</Text>
            </TouchableOpacity>
          </View>

        </View>
        {/* end card */}
      </View>
      {/* end cardOuterWrapper */}

      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordVisible}
        animationType="slide"
        onRequestClose={() => setForgotPasswordVisible(false)}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.ambientBackgroundContainer} pointerEvents="none">
            <View style={styles.ambientBlobTopRight} />
            <View style={styles.ambientBlobCenter} />
            <View style={styles.ambientBlobBottomRight} />
          </View>
          <View style={styles.scroll}>
            <View style={styles.cardOuterWrapper}>
              <View style={styles.cardGlowAuraTop} pointerEvents="none" />
              <View style={styles.cardGlowAuraBottom} pointerEvents="none" />
              <View style={styles.card}>
                <Text style={styles.heading}>Reset Password</Text>
                <Text style={styles.subheading}>Enter your email and new password</Text>

              {/* Email field */}
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={styles.input}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* New Password field */}
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={resetPassword}
                  onChangeText={setResetPassword}
                  placeholder="••••••••••"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry
                />
              </View>

              {/* Confirm Password field */}
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={resetConfirmPassword}
                  onChangeText={setResetConfirmPassword}
                  placeholder="••••••••••"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry
                />
              </View>

              {/* Reset button */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleForgotPassword}
                activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Reset Password</Text>
              </TouchableOpacity>

              {/* Cancel button */}
              <TouchableOpacity
                style={[styles.guestBtn, {marginTop: 12}]}
                onPress={() => setForgotPasswordVisible(false)}
                activeOpacity={0.85}>
                <Text style={styles.guestBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

// ─── Styles ──────────────────────────────────────────────
// all values use COLORS — nothing hardcoded below this line
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
    borderRadius: 24,
  },
  cardGlowAuraTop: {
    position: 'absolute',
    top: -8,
    left: 20,
    right: 20,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#818CF8', // Indigo glow
    opacity: 0.35,
  },
  cardGlowAuraBottom: {
    position: 'absolute',
    bottom: -8,
    left: 25,
    right: 25,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38BDF8', // Cyan/Sky glow
    opacity: 0.35,
  },
  cardGlowAuraRight: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    right: -8,
    width: 24,
    borderRadius: 12,
    backgroundColor: '#C084FC', // Purple glow
    opacity: 0.3,
  },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)', // Crisp white card surface
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.85)', // Delicate glass border
    // Refined subtle SaaS multi-layer elevation
    shadowColor: '#4338CA',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },

  // ── Explorify SaaS Brand Header ──────────────────────────
  brandHeroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9', // Subtle slate accent backdrop
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
    fontFamily: 'Inter-ExtraBold',
    color: '#64748B',
    marginTop: 2,
  },

  // ── heading ──────────────────────────────────────────
  heading: {
    fontSize: 18,
    fontWeight: '700',
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
  },

  // ── guest mode ───────────────────────────────────────
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },

  guestRowActive: {
    borderColor: COLORS.guestBorder,
    backgroundColor: COLORS.primaryLight,
  },

  guestTextWrap: {
    flex: 1,
    marginRight: 12,
  },

  guestTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.text,
  },

  guestSub: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 2,
  },

  guestBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: COLORS.primaryLight,
  },

  guestBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },

  // ── form fields ───────────────────────────────────────
  fieldWrap: {
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: COLORS.text,
    marginBottom: 6,
  },

  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.subtext,
    width: '100%',
  },

  inputFocused: {
    borderColor: COLORS.borderFocus,
  },

  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },

  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 3,
  },

  // ── password row ──────────────────────────────────────
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  forgotLink: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: COLORS.primary,
  },

  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,       // override — inner input handles this
    paddingHorizontal: 0,
  },

  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.subtext,
  },

  eyeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  eyeIcon: {
    fontSize: 15,
  },

  // ── keep signed in ────────────────────────────────────
  keepSignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },

  keepSwitch: {
    transform: [{scaleX: 0.8}, {scaleY: 0.8}], // slightly smaller switch
  },

  keepText: {
    fontSize: 12,
    color: COLORS.subtext,
  },

  // ── primary CTA ───────────────────────────────────────
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,           // full pill
    paddingVertical: 11,
    alignItems: 'center',
  },

  primaryBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },

  // ── divider ───────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 8,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    fontSize: 11,
    color: COLORS.subtext,
  },

  // ── social buttons ────────────────────────────────────
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },

  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },

  socialIcon: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
  },

  socialText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    color: COLORS.text,
  },

  // ── register link ─────────────────────────────────────
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  registerText: {
    fontSize: 12,
    color: COLORS.subtext,
  },

  registerLink: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: COLORS.primary,
  },
});

