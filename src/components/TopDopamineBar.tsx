import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Flame, Gem, Heart, Shield, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from './Tactile3DButton';

function useRollingNumber(target: number) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    if (from === target) return;
    const diff = target - from;
    const steps = 12;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplay(Math.round(from + (diff * i) / steps));
      if (i >= steps) {
        clearInterval(id);
        prev.current = target;
      }
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return display;
}

export default function TopDopamineBar() {
  const insets = useSafeAreaInsets();
  const { streakDays, freezes, flowMultiplier, xp, gems, useFreeze } = useGame();
  const [modal, setModal] = useState(false);
  const rollingXP = useRollingNumber(xp);

  const flameScale = useSharedValue(1);
  const xpPop = useSharedValue(1);

  useEffect(() => {
    flameScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700 }),
        withTiming(1.0, { duration: 700 })
      ),
      -1,
      true
    );
  }, [flameScale]);

  useEffect(() => {
    xpPop.value = withSpring(1.2, { damping: 8, stiffness: 350 }, () => {
      xpPop.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
  }, [xp, xpPop]);

  const flameAnim = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  const xpAnim = useAnimatedStyle(() => ({
    transform: [{ scale: xpPop.value }],
  }));

  const openStreak = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setModal(true);
  };

  return (
    <>
      <View style={[styles.bar, { paddingTop: Math.max(insets.top + 6, 14) }]}>
        {/* Course / Exam Badge */}
        <TouchableOpacity style={styles.coursePill} activeOpacity={0.8}>
          <Text style={styles.courseFlag}>🇮🇳</Text>
          <Text style={styles.courseTitle}>SSC CGL</Text>
        </TouchableOpacity>

        <View style={styles.rightGroup}>
          {/* Duolingo Streak Flame */}
          <TouchableOpacity onPress={openStreak} style={styles.statPill} activeOpacity={0.8}>
            <Animated.View style={flameAnim}>
              <Flame size={20} color={Colors.orangeFace} fill={Colors.orangeFace} />
            </Animated.View>
            <Text style={[styles.statValue, { color: Colors.orangeFace }]}>{streakDays}</Text>
          </TouchableOpacity>

          {/* Duolingo Gem Pill */}
          <Animated.View style={[styles.statPill, xpAnim]}>
            <Gem size={19} color={Colors.blueFace} fill={Colors.blueFace} />
            <Text style={[styles.statValue, { color: Colors.blueFace }]}>{gems}</Text>
          </Animated.View>

          {/* Duolingo Heart / Life Pill */}
          <TouchableOpacity onPress={openStreak} style={styles.statPill} activeOpacity={0.8}>
            <Heart size={19} color={Colors.redFace} fill={Colors.redFace} />
            <Text style={[styles.statValue, { color: Colors.redFace }]}>5</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Streak Protection Modal (Duolingo Style Dialog) */}
      <Modal visible={modal} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.duoShieldWrap}>
                <Shield size={34} color={Colors.blueFace} fill={Colors.blueLight} />
              </View>
              <Text style={styles.modalTitle}>{streakDays} Day Streak!</Text>
              <Text style={styles.modalSub}>
                Practice everyday to keep your flame burning. Equip streak freezes so life doesn't get in the way.
              </Text>
            </View>

            <View style={styles.freezeContainer}>
              <Text style={styles.freezeLabel}>STREAK FREEZES</Text>
              <View style={styles.freezeSlots}>
                {[0, 1].map((idx) => {
                  const hasFreeze = idx < freezes;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.freezeSlot,
                        hasFreeze && styles.freezeSlotActive,
                      ]}
                    >
                      <Text style={{ fontSize: 32, opacity: hasFreeze ? 1 : 0.25 }}>
                        🧊
                      </Text>
                      <Text style={[styles.slotTag, hasFreeze && styles.slotTagActive]}>
                        {hasFreeze ? 'EQUIPPED' : 'EMPTY'}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.freezeInfo}>
                Streak freezes preserve your progress if you miss a day. Max 2 slots.
              </Text>
            </View>

            <Tactile3DButton
              title={freezes > 0 ? 'USE 1 FREEZE' : 'REFILL FREEZES (200 💎)'}
              onPress={() => {
                if (freezes > 0) useFreeze();
                setModal(false);
              }}
              faceColor={Colors.blueFace}
              lipColor={Colors.blueLip}
            />

            <TouchableOpacity
              onPress={() => setModal(false)}
              style={styles.closeModalBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.closeModalText}>CONTINUE LEARNING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E5E5',
  },
  coursePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  courseFlag: {
    fontSize: 16,
  },
  courseTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4B4B4B',
    letterSpacing: 0.5,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 5,
    borderBottomColor: '#CECECE',
    padding: 24,
    width: '100%',
    maxWidth: 360,
    gap: 18,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 8,
  },
  duoShieldWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    color: '#4B4B4B',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalSub: {
    color: '#777777',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  freezeContainer: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    gap: 12,
  },
  freezeLabel: {
    color: '#AFAFAF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  freezeSlots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  freezeSlot: {
    width: 80,
    height: 84,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  freezeSlotActive: {
    borderColor: Colors.blueFace,
    borderBottomColor: Colors.blueLip,
    backgroundColor: Colors.blueLight,
  },
  slotTag: {
    color: '#AFAFAF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  slotTagActive: {
    color: Colors.blueLip,
  },
  freezeInfo: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '600',
  },
  closeModalBtn: {
    paddingVertical: 10,
    alignSelf: 'center',
  },
  closeModalText: {
    color: '#1CB0F6',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.8,
  },
});
