// src/components/CustomAlertModal.tsx
// ─────────────────────────────────────────────────────────
// Explorify Custom Alert Modal
// Minimalistic, modern branded alert dialog with smooth native animations,
// refined micro-typography, geometric status iconography, and tactile buttons.
// ─────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  BackHandler,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView,
} from 'react-native';
import COLORS from '../constants/colors';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
};

export type AlertConfig = {
  visible: boolean;
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  dismissible?: boolean;
};

export interface CustomAlertModalProps {
  config: AlertConfig;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────
// Geometric Minimalist Icon Component
// Crisp, resolution-independent vector glyphs with zero external dependencies
// ─────────────────────────────────────────────────────────
function AlertStatusIcon({ type }: { type: AlertType }) {
  const iconScale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    iconScale.setValue(0.4);
    Animated.spring(iconScale, {
      toValue: 1,
      friction: 6,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [type]);

  const renderGlyph = () => {
    switch (type) {
      case 'success':
        return (
          <View style={styles.glyphContainer}>
            <View style={styles.checkmarkShape} />
          </View>
        );

      case 'error':
        return (
          <View style={styles.glyphContainer}>
            <View style={[styles.crossArm, { transform: [{ rotate: '45deg' }] }]} />
            <View style={[styles.crossArm, { transform: [{ rotate: '-45deg' }] }]} />
          </View>
        );

      case 'warning':
        return (
          <View style={styles.glyphContainer}>
            <View style={styles.warningPill} />
            <View style={styles.warningDot} />
          </View>
        );

      case 'info':
      default:
        return (
          <View style={styles.glyphContainer}>
            <View style={styles.infoDot} />
            <View style={styles.infoPill} />
          </View>
        );
    }
  };

  const getContainerStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: COLORS.successLight,
          borderColor: '#A7F3D0',
        };
      case 'error':
        return {
          backgroundColor: COLORS.dangerLight,
          borderColor: '#FECACA',
        };
      case 'warning':
        return {
          backgroundColor: COLORS.warningLight,
          borderColor: '#FDE68A',
        };
      case 'info':
      default:
        return {
          backgroundColor: COLORS.primaryLight,
          borderColor: '#BFDBFE',
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.iconBadge,
        getContainerStyle(),
        { transform: [{ scale: iconScale }] },
      ]}
    >
      {renderGlyph()}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────
// Custom Alert Modal
// ─────────────────────────────────────────────────────────
export default function CustomAlertModal({ config, onClose }: CustomAlertModalProps) {
  const {
    visible,
    title,
    message,
    type = 'info',
    buttons = [],
    dismissible = true,
  } = config;

  // Local state to hold content while exit animation plays
  const [internalVisible, setInternalVisible] = useState(visible);
  const [cachedConfig, setCachedConfig] = useState(config);

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardTranslateY = useRef(new Animated.Value(14)).current;
  const isClosingRef = useRef(false);

  // Close with smooth exit transition
  const handleDismiss = useCallback(
    (onComplete?: () => void) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.94,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isClosingRef.current = false;
        setInternalVisible(false);
        onClose();
        if (onComplete) onComplete();
      });
    },
    [backdropOpacity, cardScale, cardTranslateY, onClose]
  );

  // Sync with incoming visibility prop
  useEffect(() => {
    if (visible) {
      setCachedConfig(config);
      setInternalVisible(true);
      isClosingRef.current = false;

      // Entrance animation
      backdropOpacity.setValue(0);
      cardScale.setValue(0.92);
      cardTranslateY.setValue(14);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (internalVisible) {
      handleDismiss();
    }
  }, [visible]);

  // Android hardware back button handler
  useEffect(() => {
    if (!internalVisible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dismissible) {
        handleDismiss();
        return true;
      }
      return true; // prevent default back action while modal is shown
    });

    return () => backHandler.remove();
  }, [internalVisible, dismissible, handleDismiss]);

  if (!internalVisible) return null;

  const currentConfig = visible ? config : cachedConfig;
  const currentType = currentConfig.type || 'info';
  const effectiveButtons =
    currentConfig.buttons && currentConfig.buttons.length > 0
      ? currentConfig.buttons
      : [{ text: 'OK', style: 'default' as AlertButtonStyle }];

  // Layout decision: side-by-side or stacked
  const hasLongButtonText = effectiveButtons.some(b => (b.text?.length || 0) > 12);
  const isDualButton = effectiveButtons.length === 2 && !hasLongButtonText;
  const isMultiButton = effectiveButtons.length > 2 || (effectiveButtons.length === 2 && hasLongButtonText);

  return (
    <Modal
      transparent
      visible={internalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (dismissible) handleDismiss();
      }}
    >
      <View style={styles.modalRoot}>
        {/* Animated backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableWithoutFeedback
            onPress={() => {
              if (dismissible) handleDismiss();
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Animated Card */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              transform: [
                { scale: cardScale },
                { translateY: cardTranslateY },
              ],
            },
          ]}
        >
          {/* Subtle top light reflection bar */}
          <View style={styles.cardHeaderAccent} />

          {/* Status Icon */}
          <View style={styles.iconWrapper}>
            <AlertStatusIcon type={currentType} />
          </View>

          {/* Content */}
          <View style={styles.contentWrapper}>
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.titleText}>{currentConfig.title}</Text>
              {!!currentConfig.message && (
                <Text style={styles.messageText}>{currentConfig.message}</Text>
              )}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View
            style={[
              styles.buttonsContainer,
              isDualButton && styles.dualButtonsRow,
              isMultiButton && styles.multiButtonsColumn,
            ]}
          >
            {effectiveButtons.map((btn, index) => {
              const isCancel =
                btn.style === 'cancel' ||
                (effectiveButtons.length > 1 &&
                  !btn.style &&
                  (btn.text.toLowerCase() === 'cancel' ||
                    btn.text.toLowerCase() === 'close' ||
                    btn.text.toLowerCase() === 'no'));
              const isDestructive = btn.style === 'destructive';

              return (
                <TouchableOpacity
                  key={`alert-btn-${index}-${btn.text}`}
                  activeOpacity={0.78}
                  style={[
                    styles.buttonBase,
                    isDualButton && styles.dualButtonFlex,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    !isCancel && !isDestructive && styles.buttonPrimary,
                  ]}
                  onPress={() => {
                    handleDismiss(() => {
                      if (btn.onPress) {
                        btn.onPress();
                      }
                    });
                  }}
                >
                  <Text
                    style={[
                      styles.buttonTextBase,
                      isCancel && styles.buttonCancelText,
                      isDestructive && styles.buttonDestructiveText,
                      !isCancel && !isDestructive && styles.buttonPrimaryText,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Modern Minimalist Stylesheet
// ─────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.48)', // Modern deep slate glass overlay
  },
  cardWrapper: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.16,
        shadowRadius: 28,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  cardHeaderAccent: {
    position: 'absolute',
    top: 6,
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    opacity: 0.6,
  },
  iconWrapper: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Checkmark glyph (Success)
  checkmarkShape: {
    width: 14,
    height: 8,
    borderLeftWidth: 2.6,
    borderBottomWidth: 2.6,
    borderColor: COLORS.success,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },

  // Cross glyph (Error)
  crossArm: {
    position: 'absolute',
    width: 15,
    height: 2.6,
    borderRadius: 1.3,
    backgroundColor: COLORS.danger,
  },

  // Exclamation glyph (Warning)
  warningPill: {
    width: 3.2,
    height: 10,
    borderRadius: 1.6,
    backgroundColor: COLORS.warning,
    marginBottom: 3,
  },
  warningDot: {
    width: 3.2,
    height: 3.2,
    borderRadius: 1.6,
    backgroundColor: COLORS.warning,
  },

  // Info glyph (Info)
  infoDot: {
    width: 3.2,
    height: 3.2,
    borderRadius: 1.6,
    backgroundColor: COLORS.accent,
    marginBottom: 3,
  },
  infoPill: {
    width: 3.2,
    height: 9,
    borderRadius: 1.6,
    backgroundColor: COLORS.accent,
  },

  // Content typography
  contentWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  scrollContent: {
    maxHeight: 220,
    width: '100%',
  },
  scrollContentContainer: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 13.5,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Buttons container
  buttonsContainer: {
    width: '100%',
  },
  dualButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dualButtonFlex: {
    flex: 1,
    minWidth: 0,
  },
  multiButtonsColumn: {
    flexDirection: 'column',
    gap: 8,
  },

  // Button styles
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary, // Sleek midnight primary action
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonCancel: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonDestructive: {
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },

  // Button typography
  buttonTextBase: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.1,
  },
  buttonPrimaryText: {
    color: COLORS.white,
  },
  buttonCancelText: {
    color: '#475569',
  },
  buttonDestructiveText: {
    color: COLORS.white,
  },
});
