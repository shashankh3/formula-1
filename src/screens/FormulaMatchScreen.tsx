import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Clock, Flame, Trophy, Zap, Sparkles } from 'lucide-react-native';
import { ALL_FORMULAS, FormulaCard } from '../data/formulaData';
import { useGame } from '../context/GameContext';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from '../components/Tactile3DButton';

const W = Dimensions.get('window').width;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FormulaMatchScreen() {
  const insets = useSafeAreaInsets();
  const { addXP, setDojoBest, dojoBest, bumpCombo } = useGame();

  const [pool, setPool] = useState<FormulaCard[]>(() => shuffle(ALL_FORMULAS).slice(0, 5));
  const [rightItems, setRightItems] = useState<string[]>(() =>
    shuffle(pool.map((f) => f.trigger))
  );

  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [selRight, setSelRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [combo, setCombo] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [lastMatchTime, setLastMatchTime] = useState<number>(Date.now());
  const [timeBonusActive, setTimeBonusActive] = useState<boolean>(false);

  // Upgrade 6: FEVER MODE 🔥 (Combo >= 5)
  const isFever = combo >= 5;

  const comboScale = useSharedValue(1);
  const feverPulse = useSharedValue(1);

  useEffect(() => {
    if (isFever) {
      feverPulse.value = withRepeat(
        withSequence(withTiming(1.06, { duration: 350 }), withTiming(0.98, { duration: 350 })),
        -1,
        true
      );
    } else {
      feverPulse.value = 1;
    }
  }, [isFever, feverPulse]);

  const comboStyle = useAnimatedStyle(() => ({
    transform: [{ scale: comboScale.value }],
  }));

  const feverBorderAnim = useAnimatedStyle(() => {
    if (!isFever) return { borderWidth: 0 };
    return {
      borderWidth: 3.5,
      borderColor: Colors.purpleFace,
    };
  });

  // Countdown timer
  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      setDojoBest(score);
      return;
    }
    const id = setTimeout(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [running, seconds, score, setDojoBest]);

  const startBlitz = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const initialPool = shuffle(ALL_FORMULAS).slice(0, 5);
    setPool(initialPool);
    setRightItems(shuffle(initialPool.map((f) => f.trigger)));
    setMatchedIds([]);
    setSelLeft(null);
    setSelRight(null);
    setCombo(0);
    setScore(0);
    setSeconds(60);
    setRunning(true);
    setLastMatchTime(Date.now());
  };

  const tryMatch = (cardId: string | null, triggerText: string | null) => {
    if (!cardId || !triggerText) return;
    const card = pool.find((c) => c.id === cardId);

    if (card && card.trigger === triggerText) {
      // SUCCESSFUL MATCH
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const now = Date.now();
      const latencyMs = now - lastMatchTime;
      setLastMatchTime(now);

      // Fast match (<1.5s) adds +1.5s time bonus!
      if (latencyMs < 1500) {
        setSeconds((s) => s + 1.5);
        setTimeBonusActive(true);
        setTimeout(() => setTimeBonusActive(false), 850);
      }

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      bumpCombo();

      // Double XP during FEVER MODE 🔥
      const multiplier = nextCombo >= 5 ? 2 : 1;
      const earned = (15 + nextCombo * 5) * multiplier;
      addXP(earned);

      comboScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 350 }),
        withSpring(1)
      );

      setScore((s) => s + 1);

      const nextMatched = [...matchedIds, cardId];
      setMatchedIds(nextMatched);

      // Refresh next 5 formulas when round cleared
      if (nextMatched.length >= pool.length) {
        setTimeout(() => {
          const nextPool = shuffle(ALL_FORMULAS).slice(0, 5);
          setPool(nextPool);
          setRightItems(shuffle(nextPool.map((f) => f.trigger)));
          setMatchedIds([]);
        }, 320);
      }
    } else {
      // MISMATCH
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setCombo(0);
    }

    setSelLeft(null);
    setSelRight(null);
  };

  const onLeft = (id: string) => {
    if (!running || matchedIds.includes(id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (selLeft === id) {
      setSelLeft(null);
      return;
    }
    setSelLeft(id);
    if (selRight) tryMatch(id, selRight);
  };

  const onRight = (trigger: string) => {
    if (!running) return;
    const matchingCard = pool.find((c) => c.trigger === trigger);
    if (matchingCard && matchedIds.includes(matchingCard.id)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (selRight === trigger) {
      setSelRight(null);
      return;
    }
    setSelRight(trigger);
    if (selLeft) tryMatch(selLeft, trigger);
  };

  return (
    <Animated.View style={[styles.root, feverBorderAnim]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 6, 16),
            paddingBottom: 100 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.blitzHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Formula Match Blitz ⚡</Text>
            <Text style={styles.sub}>
              Pair formula names with shortcuts in 60s. Best: {Math.max(dojoBest, score)} pairs
            </Text>
          </View>

          <View style={[styles.clock, seconds <= 10 && styles.clockUrgent]}>
            <Clock size={16} color="#FFFFFF" strokeWidth={3} />
            <Text style={styles.clockText}>{Math.ceil(seconds)}s</Text>
          </View>
        </View>

        {/* Floating +1.5s Speed Bonus Pill */}
        {timeBonusActive && (
          <View style={styles.bonusTimeBadge}>
            <Text style={styles.bonusTimeText}>+1.5s BONUS TIME ⏱️</Text>
          </View>
        )}

        {/* Animated Combo & Fever Pill */}
        <Animated.View style={[styles.comboPill, comboStyle, isFever && styles.feverPill]}>
          <Flame
            size={16}
            color={isFever ? '#FFFFFF' : Colors.amberFace}
            fill={isFever ? '#FFFFFF' : Colors.amberFace}
          />
          <Text style={[styles.comboText, isFever && styles.feverText]}>
            {isFever ? '🔥 FEVER MODE ACTIVE (2X XP)!' : `Combo x${combo}`}
          </Text>
        </Animated.View>

        {/* Pre-Blitz Welcome Banner */}
        {!running && seconds === 60 && score === 0 ? (
          <View style={styles.preBlitzBox}>
            <Text style={styles.preBlitzTitle}>60-Second Formula Madness</Text>
            <Text style={styles.howto}>
              Tap a formula trigger on the left, then tap its matching expansion on the right. Hit Combo
              x5 to activate FEVER MODE 🔥 for 2x XP and +1.5s speed bonuses!
            </Text>
            <Tactile3DButton
              title="START MATCH BLITZ (+15 XP)"
              onPress={startBlitz}
              faceColor={Colors.greenFace}
              lipColor={Colors.greenLip}
            />
          </View>
        ) : null}

        {/* Game Over Summary */}
        {!running && seconds <= 0 ? (
          <View style={styles.over}>
            <Trophy size={44} color={Colors.goldFace} />
            <Text style={styles.overTitle}>TIME UP! {score} FORMULAS MATCHED</Text>
            <Text style={styles.overSub}>
              Personal Best: {Math.max(dojoBest, score)} pairs • Daily formula reflex eliminates algebra & geometry pauses.
            </Text>
            <Tactile3DButton
              title="PLAY AGAIN"
              onPress={startBlitz}
              faceColor={Colors.greenFace}
              lipColor={Colors.greenLip}
            />
          </View>
        ) : null}

        {/* Active Matching Grid */}
        {(running || score > 0) && seconds > 0 ? (
          <View style={styles.matchGrid}>
            {/* Left Column: Formula Names */}
            <View style={styles.col}>
              <Text style={styles.colHeader}>FORMULA TRIGGER</Text>
              {pool.map((card) => {
                const isDone = matchedIds.includes(card.id);
                const isSelected = selLeft === card.id;

                return (
                  <TouchableOpacity
                    key={card.id}
                    onPress={() => onLeft(card.id)}
                    style={[
                      styles.matchCard,
                      isDone && styles.done,
                      isSelected && styles.sel,
                    ]}
                    disabled={isDone || !running}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.matchText,
                        isDone && styles.doneText,
                        isSelected && styles.selText,
                      ]}
                    >
                      {isDone ? '✓' : card.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Right Column: Expansions / Triggers */}
            <View style={styles.col}>
              <Text style={styles.colHeader}>EXPANSION / SHORTCUT</Text>
              {rightItems.map((trig, idx) => {
                const matchingCard = pool.find((c) => c.trigger === trig);
                const isDone = matchingCard ? matchedIds.includes(matchingCard.id) : false;
                const isSelected = selRight === trig;

                return (
                  <TouchableOpacity
                    key={`${trig}-${idx}`}
                    onPress={() => onRight(trig)}
                    style={[
                      styles.matchCard,
                      isDone && styles.done,
                      isSelected && styles.sel,
                    ]}
                    disabled={isDone || !running}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.matchTextRight,
                        isDone && styles.doneText,
                        isSelected && styles.selText,
                      ]}
                    >
                      {isDone ? '✓' : trig}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  blitzHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  h1: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
  },
  sub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
    lineHeight: 18,
  },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.blueFace,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  clockUrgent: {
    backgroundColor: Colors.redFace,
  },
  clockText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  bonusTimeBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderRadius: Radii.pill,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },
  bonusTimeText: {
    color: '#15803D',
    fontWeight: '900',
    fontSize: 12,
  },
  comboPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    borderColor: '#FFD7A8',
    alignSelf: 'center',
    marginBottom: 14,
  },
  feverPill: {
    backgroundColor: Colors.purpleFace,
    borderColor: Colors.purpleLip,
  },
  comboText: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '900',
  },
  feverText: {
    color: '#FFFFFF',
  },
  preBlitzBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
    marginTop: 8,
  },
  preBlitzTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  howto: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    fontWeight: '600',
  },
  over: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 10,
    marginTop: 10,
  },
  overTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
  },
  overSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  matchGrid: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  col: {
    flex: 1,
    gap: 10,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  sel: {
    borderColor: Colors.blueFace,
    backgroundColor: '#EFF6FF',
    borderBottomColor: Colors.blueLip,
  },
  done: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderBottomColor: '#4ADE80',
    opacity: 0.6,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1F2937',
    textAlign: 'center',
  },
  matchTextRight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
  },
  selText: {
    color: Colors.blueFace,
  },
  doneText: {
    color: '#15803D',
  },
});
