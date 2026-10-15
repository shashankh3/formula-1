import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Clock, Trophy, X, Zap, CheckCircle2, XCircle } from 'lucide-react-native';
import { FORMULA_CHAPTERS, FormulaChapter } from '../data/formulaData';
import { useGame } from '../context/GameContext';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from '../components/Tactile3DButton';

interface SpeedQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function UnitSpeedTestScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { chapterId } = route.params || { chapterId: 'percentage-ratio' };
  const { addXP, setUnitActivityCompleted } = useGame();

  const chapter: FormulaChapter = useMemo(() => {
    return FORMULA_CHAPTERS.find((c) => c.id === chapterId) || FORMULA_CHAPTERS[0];
  }, [chapterId]);

  // Generate 5 speed MCQs from chapter formulas and distractors (guaranteed 4 options)
  const questions: SpeedQuestion[] = useMemo(() => {
    const list: SpeedQuestion[] = chapter.formulas.map((f) => {
      const otherFormulas = chapter.formulas
        .filter((other) => other.id !== f.id)
        .map((other) => other.backFormula);
      const fallbackDistractors = [
        ...otherFormulas,
        'Cannot be determined',
        'None of these',
        'Data inadequate',
      ];
      const pool = Array.from(
        new Set([f.backFormula, ...(f.distractors || []), ...fallbackDistractors])
      );
      const distractors = pool.filter((o) => o !== f.backFormula).slice(0, 3);
      const opts = shuffle([f.backFormula, ...distractors]);
      const correctIdx = opts.indexOf(f.backFormula);
      return {
        id: f.id,
        prompt: f.frontPrompt,
        options: opts,
        correctIndex: correctIdx !== -1 ? correctIdx : 0,
        explanation: f.formula,
      };
    });
    return list.slice(0, 5);
  }, [chapter]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const urgentPulse = useSharedValue(1);
  const isUrgent = secondsLeft <= 15;

  useEffect(() => {
    if (isUrgent && !isFinished) {
      urgentPulse.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 300 }), withTiming(1.0, { duration: 300 })),
        -1,
        true
      );
    }
  }, [isUrgent, isFinished, urgentPulse]);

  const clockAnim = useAnimatedStyle(() => ({
    transform: [{ scale: isUrgent ? urgentPulse.value : 1 }],
  }));

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleFinish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFinish = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);
    setUnitActivityCompleted(chapter.id, 'speed');
    addXP(40);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleSelectOption = (index: number) => {
    if (selectedOption !== null || isFinished) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedOption(index);
    setAnswers((prev) => ({ ...prev, [currentIndex]: index }));

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        handleFinish();
      }
    }, 450);
  };

  // Score computation (+2 for correct, -0.5 for wrong)
  const results = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    let score = 0;

    questions.forEach((q, idx) => {
      const ans = answers[idx];
      if (ans !== undefined) {
        if (ans === q.correctIndex) {
          correct++;
          score += 2;
        } else {
          wrong++;
          score -= 0.5;
        }
      }
    });

    const maxScore = questions.length * 2;
    return { correct, wrong, score: Math.round(score * 10) / 10, maxScore };
  }, [answers, questions]);

  const currentQ = questions[currentIndex % questions.length] || questions[0];

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <TouchableOpacity
          onPress={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            navigation.goBack();
          }}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={24} color="#777777" strokeWidth={3} />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / Math.max(1, questions.length)) * 100}%` },
            ]}
          />
        </View>

        {/* 90s Countdown Clock */}
        <Animated.View style={[styles.clockBadge, isUrgent && styles.clockUrgent, clockAnim]}>
          <Clock size={16} color="#FFFFFF" strokeWidth={2.8} />
          <Text style={styles.clockText}>{secondsLeft}s</Text>
        </Animated.View>
      </View>

      {!isFinished ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 60 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Tag */}
          <View style={styles.tagRow}>
            <View style={styles.unitBadge}>
              <Text style={styles.unitBadgeText}>
                {chapter.title.toUpperCase()} • TIER-1 TEST
              </Text>
            </View>
            <Text style={styles.qCount}>
              QUESTION {currentIndex + 1} OF {questions.length}
            </Text>
          </View>

          {/* Question Prompt */}
          <View style={styles.promptCard}>
            <Text style={styles.markingBadge}>+2.0 Marks • -0.5 Negative</Text>
            <Text style={styles.promptText}>{currentQ.prompt}</Text>
          </View>

          {/* Options Grid */}
          <View style={styles.optionsList}>
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectOption(idx)}
                  activeOpacity={0.85}
                  style={[styles.optCard, isSelected && styles.optSelected]}
                >
                  <View style={[styles.optIndexCircle, isSelected && styles.optIndexCircleSelected]}>
                    <Text style={[styles.optIndexText, isSelected && styles.optIndexTextSelected]}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={[styles.optText, isSelected && styles.optTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* Results View */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 60 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultCard}>
            <Trophy size={48} color={Colors.goldFace} />
            <Text style={styles.resultTitle}>SPEED TEST COMPLETED!</Text>
            <Text style={styles.resultScore}>
              {results.score.toFixed(1)} / {results.maxScore} MARKS
            </Text>
            <Text style={styles.resultSubtitle}>
              {chapter.title} • Tier-1 Marking Applied
            </Text>

            {/* Stats Breakdown */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <CheckCircle2 size={20} color="#58A700" />
                <Text style={styles.statVal}>{results.correct}</Text>
                <Text style={styles.statLbl}>Correct (+2)</Text>
              </View>

              <View style={styles.statBox}>
                <XCircle size={20} color="#EA2B2B" />
                <Text style={styles.statVal}>{results.wrong}</Text>
                <Text style={styles.statLbl}>Wrong (-0.5)</Text>
              </View>

              <View style={styles.statBox}>
                <Clock size={20} color="#1CB0F6" />
                <Text style={styles.statVal}>{90 - secondsLeft}s</Text>
                <Text style={styles.statLbl}>Time Taken</Text>
              </View>
            </View>

            <View style={{ width: '100%', marginTop: 14 }}>
              <Tactile3DButton
                title="BACK TO PATH (+40 XP)"
                onPress={() => navigation.goBack()}
                faceColor={Colors.greenFace}
                lipColor={Colors.greenLip}
              />
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F0F0F0',
  },
  closeBtn: {
    padding: 6,
  },
  progressContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#E5E5E5',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.greenFace,
    borderRadius: 6,
  },
  clockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.orangeFace,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  clockUrgent: {
    backgroundColor: '#D61818',
  },
  clockText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  unitBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitBadgeText: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  qCount: {
    color: '#AFAFAF',
    fontWeight: '800',
    fontSize: 11,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    marginBottom: 18,
  },
  markingBadge: {
    color: '#D97706',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  promptText: {
    color: '#4B4B4B',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  optionsList: {
    gap: 10,
  },
  optCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  optSelected: {
    backgroundColor: '#DDF4FF',
    borderColor: '#1CB0F6',
    borderBottomColor: '#1899D6',
  },
  optIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optIndexCircleSelected: {
    backgroundColor: '#1CB0F6',
  },
  optIndexText: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 12,
  },
  optIndexTextSelected: {
    color: '#FFFFFF',
  },
  optText: {
    flex: 1,
    color: '#4B4B4B',
    fontWeight: '700',
    fontSize: 14,
  },
  optTextSelected: {
    color: '#1899D6',
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 5,
    borderBottomColor: '#CECECE',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  resultTitle: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 18,
    marginTop: 6,
  },
  resultScore: {
    color: Colors.greenFace,
    fontWeight: '900',
    fontSize: 28,
  },
  resultSubtitle: {
    color: '#777777',
    fontWeight: '600',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 14,
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 16,
  },
  statLbl: {
    color: '#777777',
    fontWeight: '700',
    fontSize: 10,
  },
});
