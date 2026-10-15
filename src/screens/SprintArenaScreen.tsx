import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Clock, Crosshair, Eye, Flame, RotateCw, Trophy, XCircle, Zap } from 'lucide-react-native';
import { SNIPER_QUESTIONS, SniperQuestion } from '../data/quantData';
import { TRUE_FALSE_DATA, TrueFalseStatement, SprintCategory, SPRINT_CATEGORIES } from '../data/sprintData';
import { useGame } from '../context/GameContext';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from '../components/Tactile3DButton';

function highlightXray(expression: string, chars: string[], show: boolean) {
  if (!show) return <Text style={styles.expr}>{expression}</Text>;
  const parts = expression.split('');
  return (
    <Text style={styles.expr}>
      {parts.map((c, i) => {
        const hot = /[0-9a-zA-Z]/.test(c) && chars.includes(c);
        return (
          <Text key={i} style={hot ? styles.hot : undefined}>
            {c}
          </Text>
        );
      })}
    </Text>
  );
}

export default function SprintArenaScreen() {
  const [mode, setMode] = useState<'sniper' | 'truefalse'>('sniper');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { addXP, bumpCombo, resetFlow, sniperBest, setSniperBest, tfBest, setTfBest } = useGame();

  // =================== SNIPER STATE ===================
  const filteredSniperQuestions = useMemo(() => {
    if (selectedCategory === 'All') return SNIPER_QUESTIONS;
    const catLower = selectedCategory.toLowerCase();
    const matched = SNIPER_QUESTIONS.filter((q) => {
      const combined = (q.title + ' ' + q.lens + ' ' + q.expression).toLowerCase();
      if (catLower === 'trigo') return combined.includes('trig');
      if (catLower === 'di') return combined.includes('table') || combined.includes('pie') || combined.includes('bar') || combined.includes('ratio');
      if (catLower === 'number system') return combined.includes('c9') || combined.includes('digit') || combined.includes('divisib') || combined.includes('cyclicity');
      if (catLower === 'mensuration') return combined.includes('sphere') || combined.includes('cylinder') || combined.includes('cone') || combined.includes('area') || combined.includes('vol');
      if (catLower === 'arithmetic') return combined.includes('ci') || combined.includes('si') || combined.includes('pct') || combined.includes('fraction') || combined.includes('lcm');
      return combined.includes(catLower);
    });
    return matched.length > 0 ? matched : SNIPER_QUESTIONS;
  }, [selectedCategory]);

  const [sniperIdx, setSniperIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showXray, setShowXray] = useState(false);
  const [sniperTimeLeft, setSniperTimeLeft] = useState(6);
  const [sniperScore, setSniperScore] = useState(0);
  const [sniperRound, setSniperRound] = useState(1);
  const [awardedSniperXP, setAwardedSniperXP] = useState(25);
  const fuse = useSharedValue(1);
  const crosshairPulse = useSharedValue(1);
  const sniperTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSniper: SniperQuestion =
    filteredSniperQuestions[sniperIdx % filteredSniperQuestions.length] || SNIPER_QUESTIONS[0];

  useEffect(() => {
    crosshairPulse.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 600 }), withTiming(1.0, { duration: 600 })),
      -1,
      true
    );
  }, [crosshairPulse]);

  useEffect(() => {
    if (mode !== 'sniper') return;
    setPicked(null);
    setShowXray(false);
    setSniperTimeLeft(6);
    fuse.value = 1;
    if (sniperTimerRef.current) clearInterval(sniperTimerRef.current);
    sniperTimerRef.current = setInterval(() => {
      setSniperTimeLeft((t) => {
        if (t <= 0.1) {
          if (sniperTimerRef.current) clearInterval(sniperTimerRef.current);
          return 0;
        }
        return Math.round((t - 0.1) * 10) / 10;
      });
    }, 100);
    return () => {
      if (sniperTimerRef.current) clearInterval(sniperTimerRef.current);
    };
  }, [sniperIdx, mode, selectedCategory]);

  useEffect(() => {
    if (mode !== 'sniper') return;
    fuse.value = withTiming(sniperTimeLeft / 6, { duration: 100 });
    if (sniperTimeLeft === 0 && picked === null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      resetFlow();
    }
  }, [sniperTimeLeft, mode]);

  const fuseStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, fuse.value * 100)}%`,
    backgroundColor:
      fuse.value > 0.5 ? Colors.orangeFace : fuse.value > 0.25 ? Colors.goldFace : Colors.redFace,
  }));

  const crosshairAnim = useAnimatedStyle(() => ({
    transform: [{ scale: crosshairPulse.value }],
  }));

  const pickSniper = (i: number) => {
    if (picked !== null || sniperTimeLeft <= 0) return;
    setPicked(i);
    if (sniperTimerRef.current) clearInterval(sniperTimerRef.current);
    if (i === currentSniper.correctIndex) {
      const speedBonus = sniperTimeLeft > 3 ? 15 : 5;
      const earned = 20 + speedBonus;
      setAwardedSniperXP(earned);
      addXP(earned);
      bumpCombo();
      const nextScore = sniperScore + 1;
      setSniperScore(nextScore);
      setSniperBest(nextScore);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      resetFlow();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const nextSniper = () => {
    setSniperIdx((v) => v + 1);
    setSniperRound((r) => r + 1);
  };

  const sniperCorrect = picked === currentSniper.correctIndex;

  // =================== TRUE / FALSE RAPID-FIRE STATE ===================
  const filteredTFData = useMemo(() => {
    if (selectedCategory === 'All') return TRUE_FALSE_DATA;
    const matched = TRUE_FALSE_DATA.filter((item) => item.category === selectedCategory);
    return matched.length > 0 ? matched : TRUE_FALSE_DATA;
  }, [selectedCategory]);

  const [tfIdx, setTfIdx] = useState(0);
  const [tfScore, setTfScore] = useState(0);
  const [tfStreak, setTfStreak] = useState(0);
  const [tfSeconds, setTfSeconds] = useState(45);
  const [tfRunning, setTfRunning] = useState(false);
  const [tfVerdict, setTfVerdict] = useState<'correct' | 'wrong' | null>(null);
  const tfTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTF: TrueFalseStatement = filteredTFData[tfIdx % filteredTFData.length] || TRUE_FALSE_DATA[0];

  const startTfSession = () => {
    setTfScore(0);
    setTfStreak(0);
    setTfSeconds(45);
    setTfIdx(0);
    setTfVerdict(null);
    setTfRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  useEffect(() => {
    if (mode === 'truefalse' && tfRunning && tfSeconds > 0) {
      tfTimerRef.current = setInterval(() => {
        setTfSeconds((s) => {
          if (s <= 1) {
            if (tfTimerRef.current) clearInterval(tfTimerRef.current);
            setTfRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (tfTimerRef.current) clearInterval(tfTimerRef.current);
    };
  }, [mode, tfRunning, tfSeconds]);

  const answerTF = (userPick: boolean) => {
    if (!tfRunning || tfSeconds <= 0) return;
    const isRight = userPick === currentTF.isTrue;

    if (isRight) {
      const nextStreak = tfStreak + 1;
      const multiplier = nextStreak >= 5 ? 3 : nextStreak >= 3 ? 2 : 1;
      addXP(10 * multiplier);
      bumpCombo();
      const nextScore = tfScore + 1;
      setTfScore(nextScore);
      setTfStreak(nextStreak);
      setTfBest(nextScore);
      setTfVerdict('correct');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // Rapid-fire progression
      setTimeout(() => {
        setTfVerdict(null);
        setTfIdx((i) => i + 1);
      }, 400);
    } else {
      setTfStreak(0);
      resetFlow();
      setTfVerdict('wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const nextTfAfterWrong = () => {
    setTfVerdict(null);
    setTfIdx((i) => i + 1);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Dojo DNA Segmented Switch */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'sniper' && styles.segmentBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setMode('sniper');
          }}
          activeOpacity={0.85}
        >
          <Crosshair size={16} color={mode === 'sniper' ? '#FFFFFF' : '#777777'} strokeWidth={2.6} />
          <Text style={[styles.segmentText, mode === 'sniper' && styles.segmentTextActive]}>
            OPTION SNIPER 🎯
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, mode === 'truefalse' && styles.segmentBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setMode('truefalse');
          }}
          activeOpacity={0.85}
        >
          <Zap size={16} color={mode === 'truefalse' ? '#FFFFFF' : '#777777'} strokeWidth={2.6} />
          <Text style={[styles.segmentText, mode === 'truefalse' && styles.segmentTextActive]}>
            TRUE / FALSE ⚡
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills (Dojo DNA) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setSelectedCategory('All');
          }}
          style={[styles.categoryPill, selectedCategory === 'All' && styles.categoryPillSelected]}
          activeOpacity={0.85}
        >
          <Text style={[styles.categoryPillText, selectedCategory === 'All' && styles.categoryPillTextSelected]}>
            🌟 All Topics
          </Text>
        </TouchableOpacity>
        {SPRINT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setSelectedCategory(cat.id);
              }}
              style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
              activeOpacity={0.85}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ===================== MODE 1: OPTION SNIPER 🎯 ===================== */}
      {mode === 'sniper' ? (
        <>
          {/* HUD Challenge Bar */}
          <View style={styles.hudCard}>
            <View style={styles.hudLeft}>
              <Animated.View style={crosshairAnim}>
                <Crosshair size={22} color={Colors.orangeFace} strokeWidth={2.6} />
              </Animated.View>
              <View>
                <Text style={styles.hudTargetText}>TARGET {sniperRound}</Text>
                <Text style={styles.hudSubText}>6-Second Option Sniper Blitz</Text>
              </View>
            </View>

            <View style={styles.hudStats}>
              <View style={styles.scoreBadge}>
                <Flame size={14} color={Colors.orangeFace} fill={Colors.orangeFace} />
                <Text style={styles.scoreVal}>{sniperScore}</Text>
              </View>
              <View style={styles.bestBadge}>
                <Trophy size={14} color={Colors.goldFace} />
                <Text style={styles.bestVal}>{Math.max(sniperBest, sniperScore)}</Text>
              </View>
            </View>
          </View>

          {/* 6s Countdown Fuse Bar */}
          <View style={styles.fuseContainer}>
            <View style={styles.fuseTrack}>
              <Animated.View style={[styles.fuseFill, fuseStyle]} />
              <View style={styles.fuseShine} />
            </View>
            <View style={styles.fuseLabelRow}>
              <Text style={[styles.fuseText, sniperTimeLeft <= 2.0 && { color: Colors.redFace }]}>
                {sniperTimeLeft <= 0 ? '💥 TIME UP!' : `⚡ ${sniperTimeLeft.toFixed(1)}s Remaining`}
              </Text>
              <Text style={styles.sniperRule}>Cast 9s • Check unit digit</Text>
            </View>
          </View>

          {/* Shortcut Lens Archetype Card */}
          <View style={styles.lensCard}>
            <View style={styles.lensHeader}>
              <Zap size={16} color={Colors.purpleFace} fill={Colors.purpleLight} />
              <Text style={styles.lensText}>{currentSniper.lens}</Text>
            </View>
            <Text style={styles.lensDetail}>{currentSniper.lensDetail}</Text>
          </View>

          {/* Problem Card */}
          <View style={styles.card}>
            <Text style={styles.cardExamBadge}>SSC CGL TIER-1 / MAINS ELIMINATION</Text>
            <Text style={styles.cardTitle}>{currentSniper.title}</Text>
            {highlightXray(currentSniper.expression, currentSniper.xrayHighlightChars, showXray)}

            {/* 4 Options 3D Buttons */}
            <View style={styles.optionsWrap}>
              {currentSniper.options.map((opt, i) => {
                const isPick = picked === i;
                const isRight = i === currentSniper.correctIndex;
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
                    onPress={() => pickSniper(i)}
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
              <View style={[styles.verdict, sniperCorrect ? styles.verdictGood : styles.verdictBad]}>
                {sniperCorrect ? (
                  <CheckCircle2 size={24} color={Colors.greenFace} />
                ) : (
                  <XCircle size={24} color={Colors.redFace} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.verdictTitle, { color: sniperCorrect ? '#58A700' : '#EA2B2B' }]}>
                    {sniperCorrect ? 'TARGET SNIPED! 🎯' : 'OPTION TRAP TRIGGERED ❌'}
                  </Text>
                  <Text style={styles.verdictText}>
                    {sniperCorrect
                      ? `+${awardedSniperXP} XP • Fast calculation eliminated all traps!`
                      : `Correct answer was ${currentSniper.options[currentSniper.correctIndex]}. Study the X-Ray shortcut below.`}
                  </Text>
                </View>
              </View>
            )}

            {/* X-Ray Vision Button */}
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
                {showXray ? 'Hide Option X-Ray' : 'Show Option X-Ray 👁️'}
              </Text>
            </TouchableOpacity>

            {showXray && (
              <View style={styles.xrayBox}>
                <Text style={styles.xrayTitle}>🔍 OPTION X-RAY</Text>
                <Text style={styles.xrayText}>{currentSniper.xray}</Text>
              </View>
            )}

            {(picked !== null || sniperTimeLeft <= 0) && (
              <View style={{ marginTop: 16 }}>
                <Tactile3DButton
                  title="NEXT TARGET →"
                  onPress={nextSniper}
                  faceColor={Colors.greenFace}
                  lipColor={Colors.greenLip}
                />
              </View>
            )}
          </View>
        </>
      ) : (
        /* ===================== MODE 2: TRUE / FALSE ⚡ ===================== */
        <>
          {/* HUD Bar */}
          <View style={styles.hudCard}>
            <View style={styles.hudLeft}>
              <Zap size={22} color={Colors.goldFace} fill={Colors.goldFace} />
              <View>
                <Text style={styles.hudTargetText}>RAPID TRUE / FALSE</Text>
                <Text style={styles.hudSubText}>45s Reflex Statement Verification</Text>
              </View>
            </View>

            <View style={styles.hudStats}>
              <View style={styles.scoreBadge}>
                <Flame size={14} color={Colors.orangeFace} fill={Colors.orangeFace} />
                <Text style={styles.scoreVal}>{tfScore}</Text>
              </View>
              <View style={styles.bestBadge}>
                <Trophy size={14} color={Colors.goldFace} />
                <Text style={styles.bestVal}>{Math.max(tfBest, tfScore)}</Text>
              </View>
            </View>
          </View>

          {/* Timer & Streak Row */}
          <View style={styles.tfHeaderRow}>
            <View style={[styles.clock, tfSeconds <= 10 && styles.clockUrgent]}>
              <Clock size={16} color="#FFFFFF" strokeWidth={3} />
              <Text style={styles.clockText}>{tfSeconds}s</Text>
            </View>

            <View style={styles.streakPill}>
              <Flame size={16} color={Colors.orangeFace} fill={Colors.orangeFace} />
              <Text style={styles.streakText}>
                Streak: {tfStreak} {tfStreak >= 5 ? '⚡ 3x XP' : tfStreak >= 3 ? '🔥 2x XP' : ''}
              </Text>
            </View>
          </View>

          {/* Pre-Game Card */}
          {!tfRunning && tfSeconds === 45 && tfScore === 0 ? (
            <View style={styles.preBlitzBox}>
              <Text style={styles.preBlitzTitle}>45-Second True / False Gauntlet</Text>
              <Text style={styles.howto}>
                Verify formulas, shortcuts, and theorems at rapid-fire speed. Build streaks for massive XP multipliers!
              </Text>
              <Tactile3DButton
                title="START RAPID-FIRE ⚡ (+20 XP)"
                onPress={startTfSession}
                faceColor={Colors.greenFace}
                lipColor={Colors.greenLip}
              />
            </View>
          ) : null}

          {/* Game Over Summary */}
          {!tfRunning && tfSeconds <= 0 ? (
            <View style={styles.over}>
              <Trophy size={42} color={Colors.goldFace} />
              <Text style={styles.overTitle}>TIME UP! {tfScore} STATEMENTS VERIFIED</Text>
              <Text style={styles.overSub}>
                Personal Best: {Math.max(tfBest, tfScore)} • Rapid verification cements high-speed formula instincts.
              </Text>
              <Tactile3DButton
                title="PLAY AGAIN"
                onPress={startTfSession}
                faceColor={Colors.greenFace}
                lipColor={Colors.greenLip}
              />
            </View>
          ) : null}

          {/* Active Statement Card */}
          {(tfRunning || tfScore > 0) && tfSeconds > 0 ? (
            <View style={styles.card}>
              <View style={styles.tfBadgeRow}>
                <Text style={styles.cardExamBadge}>{currentTF.examTag.toUpperCase()}</Text>
                <Text style={styles.tfCatBadge}>{currentTF.category}</Text>
              </View>

              <Text style={styles.tfStatement}>{currentTF.statement}</Text>

              {/* Action Buttons: TRUE ✓ and FALSE ✗ */}
              <View style={styles.tfBtnRow}>
                <View style={{ flex: 1 }}>
                  <Tactile3DButton
                    title="TRUE  ✓"
                    onPress={() => answerTF(true)}
                    faceColor={Colors.greenFace}
                    lipColor={Colors.greenLip}
                    disabled={tfVerdict !== null}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Tactile3DButton
                    title="FALSE  ✗"
                    onPress={() => answerTF(false)}
                    faceColor={Colors.redFace}
                    lipColor={Colors.redLip}
                    disabled={tfVerdict !== null}
                  />
                </View>
              </View>

              {/* Feedback on Wrong Answer */}
              {tfVerdict === 'wrong' && (
                <View style={[styles.verdict, styles.verdictBad]}>
                  <XCircle size={24} color={Colors.redFace} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.verdictTitle, { color: '#EA2B2B' }]}>
                      INCORRECT! Was {currentTF.isTrue ? 'TRUE' : 'FALSE'}
                    </Text>
                    <Text style={styles.verdictText}>{currentTF.explanation}</Text>
                    <Text style={styles.shortcutHighlight}>{currentTF.shortcutRule}</Text>
                    <View style={{ marginTop: 10 }}>
                      <Tactile3DButton
                        title="CONTINUE →"
                        onPress={nextTfAfterWrong}
                        faceColor={Colors.blueFace}
                        lipColor={Colors.blueLip}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          ) : null}
        </>
      )}

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
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    borderRadius: Radii.pill,
    padding: 4,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.pill,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: Colors.blueFace,
    shadowColor: Colors.blueLip,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 3,
    borderBottomColor: '#CECECE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  categoryPillSelected: {
    borderColor: Colors.blueFace,
    borderBottomColor: Colors.blueLip,
    backgroundColor: '#E8F5FF',
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#777777',
  },
  categoryPillTextSelected: {
    color: Colors.blueLip,
  },
  hudCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
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
    gap: 10,
  },
  hudTargetText: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  hudSubText: {
    color: '#777777',
    fontWeight: '700',
    fontSize: 11,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  scoreVal: {
    color: Colors.orangeLip,
    fontWeight: '900',
    fontSize: 13,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF5CC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  bestVal: {
    color: Colors.goldLip,
    fontWeight: '900',
    fontSize: 13,
  },
  fuseContainer: {
    marginTop: 12,
    gap: 6,
  },
  fuseTrack: {
    height: 14,
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
    marginTop: 12,
    backgroundColor: '#F6E6FF',
    borderRadius: 16,
    padding: 12,
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
    fontSize: 13,
    letterSpacing: 0.5,
  },
  lensDetail: {
    color: '#555555',
    fontWeight: '700',
    lineHeight: 17,
    fontSize: 12,
  },
  card: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    borderRadius: 20,
    padding: 16,
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
    fontSize: 16,
  },
  expr: {
    color: '#4B4B4B',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
    marginVertical: 4,
    backgroundColor: '#F7F7F7',
    padding: 12,
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
    gap: 10,
    marginTop: 6,
  },
  verdict: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verdictGood: {
    backgroundColor: '#D7FFB8',
  },
  verdictBad: {
    backgroundColor: '#FFDFE0',
  },
  verdictTitle: {
    fontWeight: '900',
    fontSize: 13,
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
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#DDF4FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  xrayToggleText: {
    color: Colors.blueLip,
    fontWeight: '900',
    fontSize: 12,
  },
  xrayBox: {
    marginTop: 8,
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    gap: 4,
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
    lineHeight: 19,
    fontSize: 12,
  },
  tfHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  clock: {
    backgroundColor: Colors.blueFace,
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockUrgent: {
    backgroundColor: Colors.redFace,
  },
  clockText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  streakText: {
    color: Colors.orangeLip,
    fontWeight: '900',
    fontSize: 13,
  },
  preBlitzBox: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
    gap: 10,
  },
  preBlitzTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#4B4B4B',
  },
  howto: {
    textAlign: 'center',
    fontSize: 13,
    color: '#777777',
    lineHeight: 18,
    fontWeight: '700',
  },
  over: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
    gap: 8,
  },
  overTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#4B4B4B',
    marginTop: 4,
  },
  overSub: {
    fontSize: 12,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 17,
    fontWeight: '700',
  },
  tfBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tfCatBadge: {
    backgroundColor: '#E8F5FF',
    color: Colors.blueLip,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  tfStatement: {
    color: '#4B4B4B',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 25,
    marginVertical: 10,
    backgroundColor: '#F7F7F7',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  tfBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  shortcutHighlight: {
    marginTop: 4,
    color: Colors.blueLip,
    fontSize: 11,
    fontWeight: '800',
  },
});
