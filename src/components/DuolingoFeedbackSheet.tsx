import React, { useEffect, useMemo } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Check, X, Trophy, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from './Tactile3DButton';

export type SheetKind = 'correct' | 'critical' | 'wrong';

interface Props {
  visible: boolean;
  kind: SheetKind;
  title: string;
  trapCategory?: string;
  goldenRule: string;
  xpText: string;
  buttonLabel?: string;
  onContinue: () => void;
}

const W = Dimensions.get('window').width;

function Confetti() {
  const dots = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        left: (i * 37) % W,
        top: (i * 47) % 130,
        size: 6 + ((i * 5) % 6),
        color: [Colors.goldFace, Colors.greenFace, Colors.blueFace, Colors.purpleFace, Colors.orangeFace][i % 5],
      })),
    []
  );
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [prog]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.7 + prog.value * 0.3,
    transform: [{ translateY: -8 * prog.value }],
  }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[{ flex: 1 }, style]}>
        <Svg width={W} height={140}>
          {dots.map((d, i) => (
            <Circle key={i} cx={d.left} cy={d.top} r={d.size / 2} fill={d.color} opacity={0.9} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

export default function DuolingoFeedbackSheet({
  visible,
  kind,
  title,
  trapCategory,
  goldenRule,
  xpText,
  buttonLabel = 'CONTINUE',
  onContinue,
}: Props) {
  const insets = useSafeAreaInsets();
  const ty = useSharedValue(500);
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      ty.value = withSpring(0, { damping: 16, stiffness: 220 });
      if (kind === 'critical') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        badgeScale.value = withRepeat(withSequence(withTiming(1.12, { duration: 300 }), withTiming(1, { duration: 300 })), -1, true);
      } else if (kind === 'correct') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } else {
      ty.value = withTiming(500, { duration: 180 });
    }
  }, [visible, kind, ty, badgeScale]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const isWrong = kind === 'wrong';
  const isCritical = kind === 'critical';

  // Authentic Duolingo bottom drawer pastel colors
  const sheetBg = isWrong ? '#FFDFE0' : isCritical ? '#FFF4CC' : '#D7FFB8';
  const titleColor = isWrong ? '#EA2B2B' : isCritical ? '#B8860B' : '#58A700';
  const iconBg = isWrong ? Colors.redFace : isCritical ? Colors.goldFace : Colors.greenFace;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Pressable style={styles.dim} onPress={() => {}} />
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: sheetBg, paddingBottom: Math.max(insets.bottom + 18, 32) },
          sheetStyle,
        ]}
      >
        {isCritical && <Confetti />}
        
        <View style={styles.headerRow}>
          <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
            {isWrong ? (
              <X size={26} color="#FFFFFF" strokeWidth={4} />
            ) : (
              <Check size={26} color="#FFFFFF" strokeWidth={4} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: titleColor }]}>
              {isWrong ? 'INCORRECT' : isCritical ? 'PERFECT COMBO!' : title || 'EXCELLENT!'}
            </Text>
            {isWrong && trapCategory ? (
              <Text style={styles.trapNotice}>{trapCategory}</Text>
            ) : null}
          </View>
        </View>

        {isCritical && (
          <Animated.View style={[styles.critBadge, badgeStyle]}>
            <Trophy size={16} color="#FFFFFF" />
            <Text style={styles.critText}>3X CRITICAL SOLVE BONUS!</Text>
            <Sparkles size={16} color="#FFFFFF" />
          </Animated.View>
        )}

        {/* SSC CGL explanation card */}
        <View style={styles.explanationCard}>
          <Text style={styles.explanationHeader}>
            {isWrong ? 'CORRECT SOLUTION & SHORTCUT:' : "GOLDEN SHORTCUT:"}
          </Text>
          <Text style={styles.explanationText}>{goldenRule}</Text>
        </View>

        <Text style={[styles.xpText, { color: isWrong ? '#EA2B2B' : '#58A700' }]}>
          {xpText}
        </Text>

        <Tactile3DButton
          title={buttonLabel}
          onPress={onContinue}
          faceColor={isWrong ? Colors.redFace : isCritical ? Colors.goldFace : Colors.greenFace}
          lipColor={isWrong ? Colors.redLip : isCritical ? Colors.goldLip : Colors.greenLip}
          textColor="#FFFFFF"
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  trapNotice: {
    color: '#D61818',
    fontWeight: '700',
    marginTop: 2,
    fontSize: 13,
  },
  critBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.goldFace,
    borderRadius: Radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  critText: {
    fontWeight: '900',
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  explanationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    gap: 6,
  },
  explanationHeader: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  explanationText: {
    color: '#4B4B4B',
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 22,
  },
  xpText: {
    fontWeight: '900',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
