import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, Heart, Lock, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { STRIKE_QUESTIONS, getQuestionsForChapter, STRIKE_TO_PATH_MAP } from '../data/quantData';
import { useGame, TrapKind } from '../context/GameContext';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from '../components/Tactile3DButton';
import TapToConvertFractionText from '../components/TapToConvertFractionText';
import ScratchpadOverlay from '../components/ScratchpadOverlay';
import DuolingoFeedbackSheet, { SheetKind } from '../components/DuolingoFeedbackSheet';

function VisualAid({ kind }: { kind: string }) {
  if (kind === 'ratioArrow') {
    return (
      <Svg width="100%" height={86}>
        <Line x1={20} y1={30} x2={300} y2={30} stroke="#E5E5E5" strokeWidth={3} />
        <Line x1={20} y1={60} x2={300} y2={60} stroke="#E5E5E5" strokeWidth={3} />
        <SvgText x={8} y={34} fill="#777777" fontSize={12} fontWeight="bold">P</SvgText>
        <SvgText x={8} y={64} fill="#777777" fontSize={12} fontWeight="bold">C</SvgText>
        <SvgText x={130} y={24} fill="#1CB0F6" fontSize={14} fontWeight="900">6 ➔ 7</SvgText>
        <SvgText x={130} y={80} fill="#58CC02" fontSize={14} fontWeight="900">7 ➔ 6 (inverse!)</SvgText>
        <Path d="M250 22 L268 30 L250 38" fill="none" stroke="#1CB0F6" strokeWidth={3} />
        <Path d="M70 52 L52 60 L70 68" fill="none" stroke="#58CC02" strokeWidth={3} />
      </Svg>
    );
  }
  if (kind === 'alligation') {
    return (
      <Svg width="100%" height={120}>
        <SvgText x={20} y={24} fill="#1CB0F6" fontSize={15} fontWeight="900">14 (A)</SvgText>
        <SvgText x={20} y={104} fill="#CE82FF" fontSize={15} fontWeight="900">12 (B)</SvgText>
        <SvgText x={150} y={64} fill="#FF9600" fontSize={16} fontWeight="900">13 (mean)</SvgText>
        <Line x1={80} y1={20} x2={140} y2={58} stroke="#58CC02" strokeWidth={2.5} strokeDasharray="5,4" />
        <Line x1={80} y1={100} x2={140} y2={62} stroke="#58CC02" strokeWidth={2.5} strokeDasharray="5,4" />
        <SvgText x={200} y={30} fill="#58CC02" fontSize={13} fontWeight="900">|12−13|=1</SvgText>
        <SvgText x={200} y={100} fill="#58CC02" fontSize={13} fontWeight="900">|14−13|=1</SvgText>
      </Svg>
    );
  }
  if (kind === 'tree') {
    return (
      <Svg width="100%" height={110}>
        <Circle cx={160} cy={18} r={14} fill="#DDF4FF" stroke="#1CB0F6" strokeWidth={2.5} />
        <SvgText x={148} y={23} fill="#1CB0F6" fontSize={12} fontWeight="900">512</SvgText>
        <Line x1={150} y1={32} x2={90} y2={70} stroke="#E5E5E5" strokeWidth={2.5} />
        <Line x1={170} y1={32} x2={230} y2={70} stroke="#E5E5E5" strokeWidth={2.5} />
        <SvgText x={70} y={92} fill="#777777" fontSize={11} fontWeight="bold">SI leg</SvgText>
        <SvgText x={200} y={92} fill="#FF9600" fontSize={11} fontWeight="bold">CI +25 units</SvgText>
        <SvgText x={110} y={108} fill="#58CC02" fontSize={11} fontWeight="900">(3n+1) : n³ = 25:512</SvgText>
      </Svg>
    );
  }
  return null;
}

export default function LessonStrikeScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { questionId, chapterId } = route.params || {};
  const question = useMemo(() => {
    if (questionId) {
      const found = STRIKE_QUESTIONS.find((q) => q.id === questionId);
      if (found) return found;
    }
    if (chapterId) {
      const questions = getQuestionsForChapter(chapterId);
      if (questions.length > 0) return questions[0];
    }
    return STRIKE_QUESTIONS[0];
  }, [questionId, chapterId]);
  const targetChapterId = chapterId || STRIKE_TO_PATH_MAP[question.chapterId] || question.chapterId;
  const { flowMultiplier, ghostRecords, registerCorrectStep, registerWrong, reviewTopic, awardCrown, addXP, setUnitActivityCompleted, setGhostIfBetter } = useGame();

  const [stepIdx, setStepIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showAid, setShowAid] = useState(false);
  const [lockLeft, setLockLeft] = useState(6);
  const [sheet, setSheet] = useState<{ visible: boolean; kind: SheetKind; title: string; trap?: string; xpText: string }>({
    visible: false,
    kind: 'correct',
    title: '',
    xpText: '',
  });

  const cardShake = useSharedValue(0);
  const stepBar = useSharedValue(0);
  const startRef = useRef(Date.now());
  const ghost = ghostRecords[question.id] ?? question.ghostTimeSeconds;

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardShake.value }],
  }));

  useEffect(() => {
    startRef.current = Date.now();
    setStepIdx(0);
    setSelectedOpt(null);
    setLockLeft(6);
  }, [question.id]);

  useEffect(() => {
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      setLockLeft(Math.max(0, 6 - s));
    }, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    stepBar.value = withSpring((stepIdx + 1) / 3, { damping: 15, stiffness: 180 });
  }, [stepIdx, stepBar]);

  const stepStyle = useAnimatedStyle(() => ({
    width: `${stepBar.value * 100}%`,
  }));

  const inferTrap = (qText: string): TrapKind => {
    if (/Base|CP|SP|base/i.test(qText)) return 'baseConfusion';
    if (/Misread|stopped|instead of/i.test(qText)) return 'misread';
    if (/Arithmetic|digit|tail|slip/i.test(qText)) return 'calcSlip';
    return 'formulaTrap';
  };

  const handleCheck = () => {
    if (selectedOpt === null) return;
    const step = question.steps[stepIdx];
    const secs = Math.max(1, Math.floor((Date.now() - startRef.current) / 1000));

    if (selectedOpt === step.correctIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (stepIdx < 2) {
        const bonus = Math.round(10 * flowMultiplier);
        addXP(10 + bonus);
        registerCorrectStep(question.id + `_s${stepIdx}`, secs);
        setStepIdx(stepIdx + 1);
        setSelectedOpt(null);
      } else {
        const crushed = secs <= ghost;
        const finalXP = crushed ? 25 : Math.round(10 * flowMultiplier) + 15;
        const isCritical = Math.random() < 0.25;
        addXP(finalXP);
        setGhostIfBetter(question.id, secs);
        reviewTopic(targetChapterId, crushed ? 4 : 3);
        awardCrown(targetChapterId);
        setUnitActivityCompleted(targetChapterId, 'drill');
        setSheet({
          visible: true,
          kind: isCritical ? 'critical' : 'correct',
          title: isCritical ? 'CRITICAL SOLVE!' : crushed ? 'SPEED RECORD BROKEN!' : 'EXCELLENT!',
          xpText: crushed
            ? `+${finalXP} XP • Beat Ghost by ${Math.max(0, ghost - secs)}s!`
            : `+${finalXP} XP • Completed in ${secs}s`,
        });
      }
    } else {
      cardShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const trapMsg = step.trapExplanations[selectedOpt] || 'Trap! Check the base calculation.';
      registerWrong(inferTrap(trapMsg));
      reviewTopic(targetChapterId, 1);
      setSheet({
        visible: true,
        kind: 'wrong',
        title: 'INCORRECT',
        trap: trapMsg,
        xpText: 'Mistake logged in Brain Vault for targeted review',
      });
    }
  };

  const step = question.steps[stepIdx];

  return (
    <View style={styles.root}>
      {/* Duolingo Top Header Bar */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={26} color="#AFAFAF" strokeWidth={3} />
        </TouchableOpacity>

        {/* Duolingo Pill Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, stepStyle]} />
          <View style={styles.progressShine} />
        </View>

        {/* Heart Counter */}
        <View style={styles.heartWrap}>
          <Heart size={22} color={Colors.redFace} fill={Colors.redFace} />
          <Text style={styles.heartText}>5</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Kicker */}
        <Text style={styles.stepKicker}>STEP {stepIdx + 1} OF 3</Text>

        {/* Mascot Speech Bubble Prompt */}
        <View style={styles.mascotRow}>
          <Text style={styles.mascotEmoji}>🦉</Text>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{step.prompt}</Text>
            <View style={styles.speechTail} />
          </View>
        </View>

        {/* Problem Card */}
        <Animated.View style={[styles.problemCard, cardStyle]}>
          <View style={styles.problemTop}>
            <Text style={styles.examTag}>{question.examTag}</Text>
            <ScratchpadOverlay locked={lockLeft > 0} lockLabel={`Mental: ${lockLeft}s`} />
          </View>

          {lockLeft > 0 && (
            <View style={styles.lockNotice}>
              <Lock size={14} color={Colors.orangeFace} />
              <Text style={styles.lockNoticeText}>
                No-Pen Lockdown ({lockLeft}s) • Frame the ratio mentally
              </Text>
            </View>
          )}

          <TapToConvertFractionText text={question.text} />

          <TouchableOpacity onPress={() => setShowAid((v) => !v)} style={styles.aidBtn} activeOpacity={0.8}>
            {showAid ? <EyeOff size={16} color={Colors.blueFace} /> : <Eye size={16} color={Colors.blueFace} />}
            <Text style={styles.aidBtnText}>{showAid ? 'Hide Visual Aid' : 'Show Visual Aid Diagram'}</Text>
          </TouchableOpacity>

          {showAid && (
            <View style={styles.aidContainer}>
              <VisualAid kind={question.visualAid} />
            </View>
          )}
        </Animated.View>

        <Text style={styles.optionsPrompt}>SELECT THE CORRECT RATIO:</Text>

        {/* Duolingo Chunky Option Cards */}
        <View style={styles.optionsList}>
          {step.options.map((opt, i) => {
            const isSelected = selectedOpt === i;
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedOpt(i);
                }}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
              >
                <View style={[styles.optionBadge, isSelected && styles.optionBadgeSelected]}>
                  <Text style={[styles.optionBadgeText, isSelected && styles.optionBadgeTextSelected]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Action Bar with 3D Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
        <Tactile3DButton
          title={selectedOpt !== null ? 'CHECK' : 'CHOOSE AN OPTION'}
          onPress={handleCheck}
          disabled={selectedOpt === null}
          faceColor={Colors.greenFace}
          lipColor={Colors.greenLip}
          style={{ width: '100%' } as object}
        />
      </View>

      <DuolingoFeedbackSheet
        visible={sheet.visible}
        kind={sheet.kind}
        title={sheet.title}
        trapCategory={sheet.trap}
        goldenRule={question.goldenRule}
        xpText={sheet.xpText}
        buttonLabel={sheet.kind === 'wrong' ? 'TRY AGAIN' : 'CONTINUE'}
        onContinue={() => {
          if (sheet.kind === 'wrong') {
            setSheet((s) => ({ ...s, visible: false }));
            setSelectedOpt(null);
          } else {
            setSheet((s) => ({ ...s, visible: false }));
            if (stepIdx >= 2) {
              navigation.goBack();
            }
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    gap: 14,
  },
  closeBtn: {
    padding: 4,
  },
  progressTrack: {
    flex: 1,
    height: 16,
    backgroundColor: '#E5E5E5',
    borderRadius: Radii.pill,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.greenFace,
    borderRadius: Radii.pill,
  },
  progressShine: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: Radii.pill,
  },
  heartWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heartText: {
    color: Colors.redFace,
    fontSize: 16,
    fontWeight: '900',
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  stepKicker: {
    color: '#AFAFAF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  mascotEmoji: {
    fontSize: 42,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: 'relative',
  },
  speechText: {
    color: '#4B4B4B',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  speechTail: {
    position: 'absolute',
    left: -7,
    top: 18,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#E5E5E5',
    transform: [{ rotate: '45deg' }],
  },
  problemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    padding: 16,
    marginBottom: 18,
  },
  problemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  examTag: {
    color: Colors.orangeFace,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.orangeLight,
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  lockNoticeText: {
    color: Colors.orangeLip,
    fontSize: 11,
    fontWeight: '800',
  },
  aidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: Colors.blueLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  aidBtnText: {
    color: Colors.blueLip,
    fontSize: 12,
    fontWeight: '800',
  },
  aidContainer: {
    marginTop: 12,
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  optionsPrompt: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  optionCardSelected: {
    backgroundColor: '#DDF4FF',
    borderColor: '#84D8FF',
    borderBottomColor: '#1CB0F6',
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionBadgeSelected: {
    backgroundColor: '#1CB0F6',
    borderColor: '#1CB0F6',
  },
  optionBadgeText: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 14,
  },
  optionBadgeTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    flex: 1,
    color: '#4B4B4B',
    fontWeight: '800',
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#1899D6',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },
});
