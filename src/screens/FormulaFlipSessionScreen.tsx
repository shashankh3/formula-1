import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, CheckCircle2, RotateCw, Sparkles, X, Zap } from 'lucide-react-native';
import { FORMULA_CHAPTERS, ALL_FORMULAS, FormulaCard } from '../data/formulaData';
import { useGame } from '../context/GameContext';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from '../components/Tactile3DButton';
import DuolingoFeedbackSheet from '../components/DuolingoFeedbackSheet';
import FormulaVisualBlueprint from '../components/FormulaVisualBlueprint';

const W = Dimensions.get('window').width;

export default function FormulaFlipSessionScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { chapterId } = route.params || { chapterId: 'algebra' };
  const { addXP, awardCrown, bumpCombo, reviewTopic, setUnitActivityCompleted } = useGame();

  const initialCards: FormulaCard[] = useMemo(() => {
    if (chapterId === 'all') return ALL_FORMULAS;
    const ch = FORMULA_CHAPTERS.find((c) => c.id === chapterId);
    return ch ? ch.formulas : FORMULA_CHAPTERS[0].formulas;
  }, [chapterId]);

  const [sessionCards, setSessionCards] = useState<FormulaCard[]>(initialCards);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  // Smooth Speed Reflex tracker
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [isSpeedReflex, setIsSpeedReflex] = useState<boolean>(false);

  // Reanimated Values for smooth card flip
  const rot = useSharedValue(0);
  const cardScale = useSharedValue(1);

  const currentCard = sessionCards[cardIdx % sessionCards.length];
  const totalCards = sessionCards.length;

  // Level determination (smooth progressive difficulty)
  // Cards 1-4: Level 1 (Basics & Foundation)
  // Cards 5-8: Level 2 (Core & Bridges)
  // Cards 9+: Level 3 (Boss Shortcuts & Traps)
  const currentLevel = cardIdx < 4 ? 1 : cardIdx < 8 ? 2 : 3;

  useEffect(() => {
    setCardStartTime(Date.now());
    setIsSpeedReflex(false);
  }, [cardIdx]);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rot.value}deg` }, { scale: cardScale.value }],
  }));

  const stepAnim = useAnimatedStyle(() => ({
    width: `${Math.min(100, ((cardIdx + 1) / totalCards) * 100)}%`,
  }));

  const handleFlip = () => {
    if (flipped) {
      // Flip back to front
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      rot.value = withTiming(90, { duration: 110 });
      setTimeout(() => {
        setFlipped(false);
        rot.value = withTiming(0, { duration: 130 });
      }, 115);
      return;
    }

    const elapsed = Date.now() - cardStartTime;
    const quick = elapsed <= 3000;
    setIsSpeedReflex(quick);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    rot.value = withTiming(90, { duration: 120 });
    setTimeout(() => {
      setFlipped(true);
      rot.value = withTiming(0, { duration: 140 });
    }, 125);
  };

  const handleAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    reviewTopic(currentCard.chapterId, 1);
    addXP(5);
    // Smooth error correction loop: push card to back of session queue
    setSessionCards((prev) => [...prev, currentCard]);
    advanceCard(1);
  };

  const handleMastered = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    reviewTopic(currentCard.chapterId, isSpeedReflex ? 4 : 3);
    const xp = isSpeedReflex ? 25 : 15;
    addXP(xp);
    bumpCombo();
    setMasteredCount((c) => c + 1);

    cardScale.value = withSequence(
      withSpring(1.04, { damping: 10, stiffness: 350 }),
      withSpring(1.0, { damping: 12, stiffness: 300 })
    );

    advanceCard();
  };

  const advanceCard = (queuedAtEnd = 0) => {
    setFlipped(false);
    rot.value = 0;
    if (cardIdx + 1 < sessionCards.length + queuedAtEnd) {
      setCardIdx((i) => i + 1);
    } else {
      setCompleted(true);
      awardCrown(chapterId);
      setUnitActivityCompleted(chapterId, 'learn');
      addXP(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={26} color="#AFAFAF" strokeWidth={3} />
        </TouchableOpacity>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, stepAnim]} />
          <View style={styles.progressShine} />
        </View>

        {/* Level Badge Pill */}
        <View
          style={[
            styles.levelPill,
            currentLevel === 1
              ? styles.levelPill1
              : currentLevel === 2
              ? styles.levelPill2
              : styles.levelPill3,
          ]}
        >
          <Text
            style={[
              styles.levelPillText,
              currentLevel === 1
                ? styles.levelPillText1
                : currentLevel === 2
                ? styles.levelPillText2
                : styles.levelPillText3,
            ]}
          >
            {currentLevel === 1
              ? '🟢 Level 1'
              : currentLevel === 2
              ? '🔵 Level 2'
              : '🟣 Level 3'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepRow}>
          <Text style={styles.stepKicker}>
            FORMULA {cardIdx + 1} OF {totalCards}
          </Text>
          {isSpeedReflex && flipped && (
            <View style={styles.speedBonusBadge}>
              <Sparkles size={12} color="#854D0E" />
              <Text style={styles.speedBonusText}>⚡ &lt;3s REFLEX! +10 BONUS XP</Text>
            </View>
          )}
        </View>

        {/* Friendly Mascot Prompt */}
        <View style={styles.mascotRow}>
          <Text style={styles.mascotEmoji}>🦉</Text>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              {!flipped
                ? 'Recall this formula mentally, then tap the card to check!'
                : "Great recall! Check the shortcut memory hook and exam note."}
            </Text>
            <View style={styles.speechTail} />
          </View>
        </View>

        {/* Big 3D Duolingo Flip Card */}
        <TouchableOpacity activeOpacity={0.92} onPress={handleFlip} style={styles.cardContainer}>
          <Animated.View style={[styles.flipCard, flipped && styles.flipCardActive, cardAnim]}>
            {!flipped ? (
              // FRONT FACE
              <View style={styles.cardFace}>
                <View style={styles.tagRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      UNIT {currentCard.unitId} • {currentCard.category.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.tapTip}>TAP TO FLIP 🔄</Text>
                </View>

                <Text style={styles.cardTitle}>{currentCard.title}</Text>
                <Text style={styles.cardPrompt}>{currentCard.frontPrompt}</Text>

                <View style={styles.frontFlipPrompt}>
                  <RotateCw size={18} color="#1CB0F6" />
                  <Text style={styles.frontFlipText}>Flip to verify formula</Text>
                </View>
              </View>
            ) : (
              // BACK FACE
              <View style={styles.cardFace}>
                <View style={styles.tagRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: '#D7FFB8' }]}>
                    <Text style={[styles.categoryBadgeText, { color: '#58A700' }]}>
                      REVEALED ✓
                    </Text>
                  </View>
                  <Text style={styles.tapTip}>TAP TO FLIP BACK</Text>
                </View>

                {/* Big Formula Highlight Box */}
                <View style={styles.formulaBox}>
                  <Text style={styles.formulaText}>{currentCard.backFormula}</Text>
                </View>

                {/* Discriminative Contrast Twin-Trap Box (when present) */}
                {currentCard.twinTrapAlert ? (
                  <View style={styles.twinTrapBox}>
                    <View style={styles.twinTrapHeader}>
                      <AlertTriangle size={15} color="#FF9600" />
                      <Text style={styles.twinTrapTitle}>⚠️ TWIN TRAP (DON'T CONFUSE):</Text>
                    </View>
                    <Text style={styles.twinTrapBody}>{currentCard.twinTrapAlert}</Text>
                  </View>
                ) : null}

                {/* Visual Blueprint Diagram (when present) */}
                {currentCard.visualType && currentCard.visualType !== 'none' ? (
                  <FormulaVisualBlueprint type={currentCard.visualType} />
                ) : null}

                {/* Speed Memory Hook */}
                <View style={styles.hookCard}>
                  <Text style={styles.hookLabel}>💡 SPEED MEMORY HOOK</Text>
                  <Text style={styles.hookText}>{currentCard.memoryHook}</Text>
                </View>

                {/* Real Exam PYQ Application */}
                <View style={styles.pyqCard}>
                  <Text style={styles.pyqLabel}>🎯 SSC CGL EXAM APPLICATION</Text>
                  <Text style={styles.pyqText}>{currentCard.pyqExample}</Text>
                </View>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Bottom Action Bar with 2 Clean Tactile Buttons */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
        {!flipped ? (
          <Tactile3DButton
            title="TAP TO REVEAL FORMULA 🔄"
            onPress={handleFlip}
            faceColor={Colors.blueFace}
            lipColor={Colors.blueLip}
            style={{ width: '100%' } as object}
          />
        ) : (
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Tactile3DButton
                title="STILL LEARNING 🔁"
                onPress={handleAgain}
                faceColor="#FFFFFF"
                lipColor="#CECECE"
                textColor="#777777"
                small
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <Tactile3DButton
                title="MASTERED! ⭐ (+15 XP)"
                onPress={handleMastered}
                faceColor={Colors.greenFace}
                lipColor={Colors.greenLip}
                small
              />
            </View>
          </View>
        )}
      </View>

      {/* Completion Modal */}
      <DuolingoFeedbackSheet
        visible={completed}
        kind="correct"
        title="UNIT MASTERED! 👑"
        goldenRule="Daily formula reflex training locks in instant zero-pen execution for SSC CGL."
        xpText={`+60 BONUS XP • ${masteredCount}/${totalCards} Formulas Mastered!`}
        buttonLabel="CONTINUE TO PATH"
        onContinue={() => {
          setCompleted(false);
          navigation.goBack();
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
    gap: 12,
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
  levelPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
  },
  levelPill1: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  levelPill2: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  levelPill3: {
    backgroundColor: '#FAF5FF',
    borderColor: '#D8B4FE',
  },
  levelPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  levelPillText1: {
    color: '#15803D',
  },
  levelPillText2: {
    color: '#1D4ED8',
  },
  levelPillText3: {
    color: '#7E22CE',
  },
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepKicker: {
    color: '#AFAFAF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
  speedBonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: '#EAB308',
  },
  speedBonusText: {
    color: '#854D0E',
    fontSize: 10,
    fontWeight: '900',
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  mascotEmoji: {
    fontSize: 40,
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
    paddingVertical: 10,
    position: 'relative',
  },
  speechText: {
    color: '#4B4B4B',
    fontSize: 13.5,
    fontWeight: '800',
    lineHeight: 19,
  },
  speechTail: {
    position: 'absolute',
    left: -7,
    top: 16,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#E5E5E5',
    transform: [{ rotate: '45deg' }],
  },
  cardContainer: {
    marginTop: 6,
  },
  flipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 6,
    borderBottomColor: '#CECECE',
    padding: 20,
    minHeight: 330,
    justifyContent: 'center',
  },
  flipCardActive: {
    borderColor: '#88E23B',
    borderBottomColor: '#58A700',
  },
  cardFace: {
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#DDF4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  categoryBadgeText: {
    color: '#1899D6',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  tapTip: {
    color: '#AFAFAF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: '#1F2937',
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 27,
  },
  cardPrompt: {
    color: '#4B5563',
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 23,
  },
  frontFlipPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F7F7F7',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  frontFlipText: {
    color: '#1CB0F6',
    fontWeight: '900',
    fontSize: 15,
  },
  formulaBox: {
    backgroundColor: '#D7FFB8',
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: '#88E23B',
    borderBottomWidth: 4,
    borderBottomColor: '#58A700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formulaText: {
    color: '#2E7D32',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  twinTrapBox: {
    backgroundColor: '#FFF4E5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FF9600',
    borderBottomWidth: 3,
    gap: 4,
  },
  twinTrapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  twinTrapTitle: {
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  twinTrapBody: {
    color: '#7C2D12',
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  hookCard: {
    backgroundColor: '#FFF5CC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FFE066',
    gap: 4,
  },
  hookLabel: {
    color: '#B8860B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  hookText: {
    color: '#4B4B4B',
    fontWeight: '700',
    fontSize: 12.5,
    lineHeight: 18,
  },
  pyqCard: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    gap: 4,
  },
  pyqLabel: {
    color: '#777777',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  pyqText: {
    color: '#4B4B4B',
    fontWeight: '700',
    fontSize: 12.5,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
