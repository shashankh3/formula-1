import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Crosshair, Eye, CheckCircle2, XCircle, Zap, Flame, Trophy } from 'lucide-react-native';
import { SNIPER_QUESTIONS } from '../data/quantData';
import { useGame } from '../context/GameContext';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from '../components/Tactile3DButton';

function highlightXray(expression: string, chars: string[], show: boolean) {
  if (!show) return <Text style={styles.expr}>{expression}</Text>;
  const parts = expression.split('');
  return (
    <Text style={styles.expr}>
      {parts.map((c, i) => {
        const hot = /[0-9]/.test(c) && chars.includes(c);
        return (
          <Text key={i} style={hot ? styles.hot : undefined}>
            {c}
          </Text>
        );
      })}
    </Text>
  );
}

export default function OptionSniperScreen() {
  const { addXP, bumpCombo, resetFlow, setSniperBest, sniperBest } = useGame();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showXray, setShowXray] = useState(false);
  const [timeLeft, setTimeLeft] = useState(6);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [awardedXP, setAwardedXP] = useState(25);
  const fuse = useSharedValue(1);
  const crosshairPulse = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = SNIPER_QUESTIONS[idx % SNIPER_QUESTIONS.length];

  useEffect(() => {
    crosshairPulse.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 600 }), withTiming(1.0, { duration: 600 })),
      -1,
      true
    );
  }, [crosshairPulse]);

  useEffect(() => {
    setPicked(null);
    setShowXray(false);
    setTimeLeft(6);
    fuse.value = 1;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return Math.round((t - 0.1) * 10) / 10;
      });
    }, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [idx]);

  useEffect(() => {
    fuse.value = withTiming(timeLeft / 6, { duration: 100 });
    if (timeLeft === 0 && picked === null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      resetFlow();
    }
  }, [timeLeft]);

  const fuseStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, fuse.value * 100)}%`,
    backgroundColor:
      fuse.value > 0.5 ? Colors.orangeFace : fuse.value > 0.25 ? Colors.goldFace : Colors.redFace,
  }));

  const crosshairAnim = useAnimatedStyle(() => ({
    transform: [{ scale: crosshairPulse.value }],
  }));

  const pick = (i: number) => {
    if (picked !== null || timeLeft <= 0) return;
    setPicked(i);
    if (timerRef.current) clearInterval(timerRef.current);
    if (i === q.correctIndex) {
      const speedBonus = timeLeft > 3 ? 15 : 5;
      const earned = 20 + speedBonus;
      setAwardedXP(earned);
      addXP(earned);
      bumpCombo();
      const nextScore = score + 1;
      setScore(nextScore);
      setSniperBest(nextScore);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      resetFlow();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const next = () => {
    setIdx((v) => v + 1);
    setRound((r) => r + 1);
  };

  const correct = picked === q.correctIndex;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Duolingo Challenge HUD Header */}
      <View style={styles.hudCard}>
        <View style={styles.hudLeft}>
          <Animated.View style={crosshairAnim}>
            <Crosshair size={22} color={Colors.orangeFace} strokeWidth={2.6} />
          </Animated.View>
          <View>
            <Text style={styles.hudTargetText}>TARGET {round}</Text>
            <Text style={styles.hudSubText}>6-Second Option Sniper Blitz</Text>
          </View>
        </View>

        <View style={styles.hudStats}>
          <View style={styles.scoreBadge}>
            <Flame size={14} color={Colors.orangeFace} fill={Colors.orangeFace} />
            <Text style={styles.scoreVal}>{score}</Text>
          </View>
          <View style={styles.bestBadge}>
            <Trophy size={14} color={Colors.goldFace} />
            <Text style={styles.bestVal}>{Math.max(sniperBest, score)}</Text>
          </View>
        </View>
      </View>

      {/* Countdown Timer Bar */}
      <View style={styles.fuseContainer}>
        <View style={styles.fuseTrack}>
          <Animated.View style={[styles.fuseFill, fuseStyle]} />
          <View style={styles.fuseShine} />
        </View>
        <View style={styles.fuseLabelRow}>
          <Text style={[styles.fuseText, timeLeft <= 2.0 && { color: Colors.redFace }]}>
            {timeLeft <= 0 ? '💥 TIME UP!' : `⚡ ${timeLeft.toFixed(1)}s Remaining`}
          </Text>
          <Text style={styles.sniperRule}>Filter by unit digit & C9</Text>
        </View>
      </View>

      {/* Lens Archetype Card */}
      <View style={styles.lensCard}>
        <View style={styles.lensHeader}>
          <Zap size={16} color={Colors.purpleFace} fill={Colors.purpleLight} />
          <Text style={styles.lensText}>{q.lens}</Text>
        </View>
        <Text style={styles.lensDetail}>{q.lensDetail}</Text>
      </View>

      {/* Problem Card */}
      <View style={styles.card}>
        <Text style={styles.cardExamBadge}>SSC CGL TIER-1 / MAINS ELIMINATION</Text>
        <Text style={styles.cardTitle}>{q.title}</Text>
        {highlightXray(q.expression, q.xrayHighlightChars, showXray)}

        {/* 4 Interactive 3D Options */}
        <View style={styles.optionsWrap}>
          {q.options.map((opt, i) => {
            const isPick = picked === i;
            const isRight = i === q.correctIndex;
            let face: string = '#FFFFFF';
            let lip: string = '#CECECE';
            let textColor = '#4B4B4B';

            if (picked !== null) {
              if (isRight) {
                face = Colors.greenFace;
                lip = Colors.greenLip;
                textColor = '#FFFFFF';
              } else if (isPick) {
                face = Colors.redFace;
                lip = Colors.redLip;
                textColor = '#FFFFFF';
              }
            }
            return (
              <Tactile3DButton
                key={i}
                title={`${'ABCD'[i]}.  ${opt}`}
                onPress={() => pick(i)}
                faceColor={face}
                lipColor={lip}
                textColor={textColor}
                disabled={picked !== null}
              />
            );
          })}
        </View>

        {/* Verdict Feedback */}
        {picked !== null && (
          <View style={[styles.verdict, correct ? styles.verdictGood : styles.verdictBad]}>
            {correct ? (
              <CheckCircle2 size={24} color={Colors.greenFace} />
            ) : (
              <XCircle size={24} color={Colors.redFace} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.verdictTitle, { color: correct ? '#58A700' : '#EA2B2B' }]}>
                {correct ? 'TARGET SNIPED! 🎯' : 'OPTION TRAP TRIGGERED ❌'}
              </Text>
              <Text style={styles.verdictText}>
                {correct
                  ? `+${awardedXP} XP • Fast calculation eliminated all traps!`
                  : `Correct answer was ${q.options[q.correctIndex]}. Study the X-Ray shortcut below.`}
              </Text>
            </View>
          </View>
        )}

        {/* X-Ray Vision Toggle */}
        <TouchableOpacity
          onPress={() => {
            setShowXray((v) => !v);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }}
          style={styles.xrayToggle}
          activeOpacity={0.8}
        >
          <Eye size={16} color={Colors.blueFace} />
          <Text style={styles.xrayToggleText}>
            {showXray ? 'Hide Digital Sum / Divisibility X-Ray' : 'Show Digital Sum (C9) X-Ray 👁️'}
          </Text>
        </TouchableOpacity>

        {showXray && (
          <View style={styles.xrayBox}>
            <Text style={styles.xrayTitle}>🔍 OPTION X-RAY</Text>
            <Text style={styles.xrayText}>{q.xray}</Text>
          </View>
        )}

        {(picked !== null || timeLeft <= 0) && (
          <View style={{ marginTop: 16 }}>
            <Tactile3DButton
              title="NEXT TARGET →"
              onPress={next}
              faceColor={Colors.greenFace}
              lipColor={Colors.greenLip}
            />
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  hudCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hudTargetText: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  hudSubText: {
    color: '#777777',
    fontWeight: '700',
    fontSize: 12,
  },
  hudStats: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  scoreVal: {
    color: Colors.orangeLip,
    fontWeight: '900',
    fontSize: 14,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF5CC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  bestVal: {
    color: Colors.goldLip,
    fontWeight: '900',
    fontSize: 14,
  },
  fuseContainer: {
    marginTop: 14,
    gap: 6,
  },
  fuseTrack: {
    height: 16,
    backgroundColor: '#E5E5E5',
    borderRadius: Radii.pill,
    overflow: 'hidden',
    position: 'relative',
  },
  fuseFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  fuseShine: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: Radii.pill,
  },
  fuseLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fuseText: {
    color: Colors.orangeLip,
    fontWeight: '900',
    fontSize: 12,
  },
  sniperRule: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '700',
  },
  lensCard: {
    marginTop: 14,
    backgroundColor: '#F6E6FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E8D4FF',
    gap: 4,
  },
  lensHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lensText: {
    fontWeight: '900',
    color: Colors.purpleLip,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  lensDetail: {
    color: '#555555',
    fontWeight: '700',
    lineHeight: 18,
    fontSize: 12,
  },
  card: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  cardExamBadge: {
    color: '#AFAFAF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 17,
  },
  expr: {
    color: '#4B4B4B',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 25,
    marginVertical: 4,
    backgroundColor: '#F7F7F7',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  hot: {
    backgroundColor: '#D7FFB8',
    color: '#58A700',
    fontWeight: '900',
  },
  optionsWrap: {
    gap: 12,
    marginTop: 8,
  },
  verdict: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verdictGood: {
    backgroundColor: '#D7FFB8',
  },
  verdictBad: {
    backgroundColor: '#FFDFE0',
  },
  verdictTitle: {
    fontWeight: '900',
    fontSize: 14,
  },
  verdictText: {
    color: '#4B4B4B',
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  xrayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#DDF4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  xrayToggleText: {
    color: Colors.blueLip,
    fontWeight: '900',
    fontSize: 12,
  },
  xrayBox: {
    marginTop: 10,
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    gap: 6,
  },
  xrayTitle: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  xrayText: {
    color: '#4B4B4B',
    fontWeight: '700',
    lineHeight: 20,
    fontSize: 13,
  },
});
