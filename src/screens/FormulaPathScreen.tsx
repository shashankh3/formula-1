import React, { useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BookOpen, Check, CheckCircle2, ChevronRight, Clock, Crown, Gift, Lock, Sparkles, Star, Target, Trophy, X, Zap } from 'lucide-react-native';
import { FORMULA_CHAPTERS, FormulaChapter } from '../data/formulaData';
import { useGame } from '../context/GameContext';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from '../components/Tactile3DButton';

function NodeRing({
  progress,
  isBoss,
  isActive,
  children,
}: {
  progress: number;
  isBoss?: boolean;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  const R = 40;
  const C = 2 * Math.PI * R;
  const ringColor = isBoss ? Colors.goldFace : Colors.greenFace;

  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(withTiming(1.12, { duration: 800 }), withTiming(1.0, { duration: 800 })),
        -1,
        true
      );
    }
  }, [isActive, pulse]);

  const haloAnim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: isActive ? 0.35 : 0,
  }));

  return (
    <View style={styles.ringWrap}>
      {isActive && (
        <Animated.View
          style={[
            styles.activeHalo,
            { backgroundColor: isBoss ? Colors.goldLight : Colors.greenLight },
            haloAnim,
          ]}
        />
      )}
      <Svg width={96} height={96}>
        <Circle cx={48} cy={48} r={R} stroke="#E5E5E5" strokeWidth={6} fill="none" />
        <Circle
          cx={48}
          cy={48}
          r={R}
          stroke={ringColor}
          strokeWidth={6}
          fill="none"
          strokeDasharray={`${C}`}
          strokeDashoffset={C * (1 - progress)}
          strokeLinecap="round"
          rotation={-90}
          origin="48,48"
        />
      </Svg>
      <View style={styles.ringInner}>{children}</View>
    </View>
  );
}

function DuolingoStartTooltip({ label }: { label: string }) {
  const y = useSharedValue(0);
  React.useEffect(() => {
    y.value = withRepeat(
      withSequence(withTiming(-6, { duration: 600 }), withTiming(0, { duration: 600 })),
      -1,
      true
    );
  }, [y]);

  const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[styles.tooltip, s]}>
      <Text style={styles.tooltipText}>{label}</Text>
      <View style={styles.tooltipNub} />
    </Animated.View>
  );
}

const PHASE_CONFIGS: Record<
  number,
  {
    kicker: string;
    title: string;
    desc: string;
    faceColor: string;
    lipColor: string;
    icon: string;
  }
> = {
  1: {
    kicker: 'PHASE 1 • FOUNDATIONS (LOW LEVEL)',
    title: 'Tier-1 Core Foundations 🟢',
    desc: 'Percentage AB Rule • CP/MP Ratio • Tree Method • Ratio Cross',
    faceColor: Colors.greenFace,
    lipColor: Colors.greenLip,
    icon: '🌱',
  },
  2: {
    kicker: 'PHASE 2 • SPEED ARITHMETIC (MEDIUM LEVEL)',
    title: 'Tier-1 Speed Arithmetic 🟡',
    desc: 'Alligation Cross • Deviation • LCM Work • Speed Inversion',
    faceColor: '#1CB0F6',
    lipColor: '#1899D6',
    icon: '⚡',
  },
  3: {
    kicker: 'PHASE 3 • ADVANCE MATHS (HARDER LEVEL)',
    title: 'Tier-1 Advance Maths 🔴',
    desc: 'Digital Sum • Value-Putting • 16 Triplets • Circle Chords • π-Sniper',
    faceColor: '#FF9600',
    lipColor: '#E07800',
    icon: '🔥',
  },
  4: {
    kicker: 'PHASE 4 • TIER 1 FINALE (BOSS LEVEL)',
    title: 'Tier-1 Grand Finale 👑',
    desc: 'Coordinate Shoelace Area • Empirical Mode = 3 Median - 2 Mean',
    faceColor: '#CE82FF',
    lipColor: '#A559D8',
    icon: '👑',
  },
};

const DIFFICULTY_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  LOW: { bg: '#E8F9DB', text: '#2E7D32', border: '#B9E8A2' },
  MEDIUM: { bg: '#DDF4FF', text: '#1899D6', border: '#84D8FF' },
  HARD: { bg: '#FFF0DB', text: '#D97706', border: '#FDE68A' },
  BOSS: { bg: '#F3E8FF', text: '#7C3AED', border: '#D8B4FE' },
};

export default function FormulaPathScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { crowns, unitProgress } = useGame();
  const [selectedUnit, setSelectedUnit] = useState<FormulaChapter | null>(null);

  const openUnit = (ch: FormulaChapter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedUnit(ch);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingBottom: 90 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Banner */}
        <View style={[styles.topBanner, { marginTop: Math.max(insets.top + 6, 14) }]}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerKicker}>SSC CGL TIER 1 • QUANT TACTICS</Text>
            <Text style={styles.bannerTitle}>Zero-Formula Mastery Path</Text>
            <Text style={styles.bannerDesc}>
              Arranged progressively from Low to Harder level • 14 Units
            </Text>
          </View>

          <TouchableOpacity
            style={styles.guidebookBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Dojo')}
          >
            <BookOpen size={18} color="#FFFFFF" />
            <Text style={styles.guidebookText}>DOJO</Text>
          </TouchableOpacity>
        </View>

        {/* Coach Coach Advice Bubble */}
        <View style={styles.coachBubble}>
          <Text style={styles.coachAvatar}>🦉</Text>
          <View style={styles.bubbleCard}>
            <Text style={styles.bubbleText}>
              <Text style={{ fontWeight: '900', color: Colors.greenFace }}>Coach:</Text> Start
              with Foundation (Percentage & Tree Method), conquer Speed Arithmetic, and scale up to
              Advance Maths. Complete Learn, Drill & Speed Test on every unit to crush Tier 1!
            </Text>
            <View style={styles.bubbleTail} />
          </View>
        </View>

        {/* The Winding Stepping Stones Path */}
        <View style={styles.pathArea}>
          {FORMULA_CHAPTERS.map((ch, index) => {
            const screenWidth = Dimensions.get('window').width;
            const nodeWidth = 220;
            const centerOffset = Math.max(16, (screenWidth - nodeWidth) / 2);
            const maxWave = Math.min(44, Math.max(16, (screenWidth - nodeWidth) / 2 - 12));
            const wave = Math.sin(index * 1.05) * maxWave;
            const crown = crowns[ch.id] ?? 0;
            const progress = Math.min(1, crown / 5 + (index === 0 ? 0.5 : 0.1));
            const isBoss = !!ch.isBoss;
            const isCompleted = crown >= 5;
            const isActive = index === 0 || (crowns[FORMULA_CHAPTERS[index - 1]?.id] ?? 0) > 0;
            const prog = unitProgress?.[ch.id] || {};

            const isPhaseStart =
              index === 0 ||
              ch.phase !== FORMULA_CHAPTERS[index - 1]?.phase;
            const phaseCfg = PHASE_CONFIGS[ch.phase] || PHASE_CONFIGS[1];
            const diffStyle = DIFFICULTY_STYLES[ch.levelTag] || DIFFICULTY_STYLES.LOW;

            return (
              <React.Fragment key={ch.id}>
                {/* Duolingo Section / Phase Banner */}
                {isPhaseStart && (
                  <View
                    style={[
                      styles.phaseBanner,
                      {
                        backgroundColor: phaseCfg.faceColor,
                        borderBottomColor: phaseCfg.lipColor,
                        marginTop: index === 0 ? 10 : 28,
                      },
                    ]}
                  >
                    <View style={styles.phaseLeft}>
                      <Text style={styles.phaseKicker}>{phaseCfg.kicker}</Text>
                      <Text style={styles.phaseTitle}>{phaseCfg.title}</Text>
                      <Text style={styles.phaseDesc}>{phaseCfg.desc}</Text>
                    </View>
                    <Text style={styles.phaseIcon}>{phaseCfg.icon}</Text>
                  </View>
                )}

                {/* Node Row */}
                <View style={[styles.nodeRow, { marginLeft: centerOffset + wave }]}>
                  {index === 0 && <DuolingoStartTooltip label="START TIER 1 +15 XP" />}

                  <NodeRing progress={progress} isBoss={isBoss} isActive={index === 0}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => openUnit(ch)}
                      style={[
                        styles.nodeBtn,
                        isBoss && styles.bossBtn,
                        isCompleted && styles.completedBtn,
                        !isActive && styles.nodeBtnLocked,
                      ]}
                    >
                      {isCompleted ? (
                        <Check size={32} color="#FFFFFF" strokeWidth={4} />
                      ) : isBoss ? (
                        <Trophy size={32} color="#FFFFFF" />
                      ) : !isActive ? (
                        <Lock size={26} color="#AFAFAF" />
                      ) : (
                        <Text style={{ fontSize: 30 }}>{ch.icon}</Text>
                      )}

                      {isActive && <View style={styles.nodeSpecular} />}
                    </TouchableOpacity>
                  </NodeRing>

                  {/* Stars / Crown Row */}
                  <View style={styles.crownRow}>
                    {[1, 2, 3, 4, 5].map((c) => (
                      <Crown
                        key={c}
                        size={13}
                        color={c <= crown ? Colors.goldFace : '#D1D5DB'}
                        fill={c <= crown ? Colors.goldFace : 'transparent'}
                      />
                    ))}
                  </View>

                  {/* Duolingo Lesson Card */}
                  <TouchableOpacity
                    onPress={() => openUnit(ch)}
                    activeOpacity={0.85}
                    style={[styles.labelCard, isBoss && styles.bossCard]}
                  >
                    {/* Difficulty Level & Tactic Badge */}
                    <View style={styles.cardHeaderRow}>
                      <View
                        style={[
                          styles.diffBadge,
                          { backgroundColor: diffStyle.bg, borderColor: diffStyle.border },
                        ]}
                      >
                        <Text style={[styles.diffBadgeText, { color: diffStyle.text }]}>
                          {ch.levelTag}
                        </Text>
                      </View>

                      <Text style={styles.cardCountText}>
                        {ch.formulas.length} {ch.formulas.length === 1 ? 'Tactic' : 'Tactics'}
                      </Text>
                    </View>

                    <Text style={styles.nodeTitle}>
                      {index + 1}. {ch.title}
                    </Text>

                    {/* Speed Tactic Hook */}
                    <View style={styles.tacticChip}>
                      <Text style={styles.tacticChipText} numberOfLines={1}>
                        🎯 {ch.tacticName}
                      </Text>
                    </View>

                    {/* 3 Mini Progress Dots: Learn / Drill / Speed */}
                    <View style={styles.miniDotsRow}>
                      <View style={[styles.miniDot, prog.learn && styles.miniDotActive]}>
                        <Text style={[styles.miniDotText, prog.learn && styles.miniDotTextActive]}>
                          {prog.learn ? '✓ LEARN' : '📘 LEARN'}
                        </Text>
                      </View>
                      <View style={[styles.miniDot, prog.drill && styles.miniDotActive]}>
                        <Text style={[styles.miniDotText, prog.drill && styles.miniDotTextActive]}>
                          {prog.drill ? '✓ DRILL' : '🎯 DRILL'}
                        </Text>
                      </View>
                      <View style={[styles.miniDot, prog.speed && styles.miniDotActive]}>
                        <Text style={[styles.miniDotText, prog.speed && styles.miniDotTextActive]}>
                          {prog.speed ? '✓ SPEED' : '⏱️ SPEED'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Milestone Gift Chest after Unit 4 (End of Foundation) */}
                {index === 3 && (
                  <View style={[styles.chestRow, { marginLeft: centerOffset }]}>
                    <TouchableOpacity
                      style={styles.chestBtn}
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        navigation.navigate('Blitz');
                      }}
                      activeOpacity={0.85}
                    >
                      <Gift size={28} color={Colors.goldFace} />
                      <View style={styles.chestBadge}>
                        <Text style={styles.chestBadgeText}>FOUNDATION CHEST 🎁</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Milestone Gift Chest after Unit 8 (End of Speed Arithmetic) */}
                {index === 7 && (
                  <View style={[styles.chestRow, { marginLeft: centerOffset }]}>
                    <TouchableOpacity
                      style={styles.chestBtn}
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        navigation.navigate('Blitz');
                      }}
                      activeOpacity={0.85}
                    >
                      <Gift size={28} color={Colors.goldFace} />
                      <View style={styles.chestBadge}>
                        <Text style={styles.chestBadgeText}>SPEED CHEST ⚡</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Milestone Gift Chest after Unit 13 (End of Advance Maths) */}
                {index === 12 && (
                  <View style={[styles.chestRow, { marginLeft: centerOffset }]}>
                    <TouchableOpacity
                      style={styles.chestBtn}
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                        navigation.navigate('Blitz');
                      }}
                      activeOpacity={0.85}
                    >
                      <Trophy size={28} color={Colors.goldFace} />
                      <View style={styles.chestBadge}>
                        <Text style={styles.chestBadgeText}>ADVANCE TROPHY 🏆</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Duolingo Unit Action Bottom Sheet Modal */}
      {selectedUnit ? (
        <Modal
          visible={!!selectedUnit}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedUnit(null)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalDismissArea}
              activeOpacity={1}
              onPress={() => setSelectedUnit(null)}
            />

            <View style={[styles.sheetCard, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
              {/* Sheet Drag Handle */}
              <View style={styles.sheetHandle} />

              {/* Sheet Header */}
              <View style={styles.sheetHeader}>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={styles.sheetTagRow}>
                    <View style={styles.sheetBadge}>
                      <Text style={styles.sheetBadgeText}>
                        UNIT {selectedUnit.unitId} • {selectedUnit.levelTag}
                      </Text>
                    </View>
                    <Text style={styles.sheetPhaseText}>
                      PHASE {selectedUnit.phase}
                    </Text>
                  </View>
                  <Text style={styles.sheetTitle}>{selectedUnit.title}</Text>
                  <Text style={styles.sheetTactic}>🎯 {selectedUnit.tacticName}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setSelectedUnit(null)}
                  style={styles.sheetCloseBtn}
                >
                  <X size={20} color="#777777" strokeWidth={2.8} />
                </TouchableOpacity>
              </View>

              {/* 3 Action Choices: Learn, Drill, Speed Test */}
              <View style={styles.actionList}>
                {/* 1. LEARN */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => {
                    const u = selectedUnit;
                    setSelectedUnit(null);
                    navigation.navigate('FormulaFlipSession', { chapterId: u.id });
                  }}
                  style={styles.actionCard}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: '#DDF4FF' }]}>
                    <BookOpen size={24} color="#1CB0F6" strokeWidth={2.5} />
                  </View>
                  <View style={styles.actionBody}>
                    <View style={styles.actionTitleRow}>
                      <Text style={styles.actionTitle}>📘 LEARN</Text>
                      {unitProgress?.[selectedUnit.id]?.learn ? (
                        <View style={styles.donePill}><Text style={styles.donePillText}>DONE ✓</Text></View>
                      ) : null}
                    </View>
                    <Text style={styles.actionDesc}>
                      Interactive 3D formula flashcards & memory hooks
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#CECECE" />
                </TouchableOpacity>

                {/* 2. DRILL */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => {
                    const u = selectedUnit;
                    setSelectedUnit(null);
                    navigation.navigate('LessonStrike', { chapterId: u.id });
                  }}
                  style={styles.actionCard}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: '#E8F9DB' }]}>
                    <Target size={24} color="#58CC02" strokeWidth={2.5} />
                  </View>
                  <View style={styles.actionBody}>
                    <View style={styles.actionTitleRow}>
                      <Text style={styles.actionTitle}>🎯 DRILL (3-STEP PYQ)</Text>
                      {unitProgress?.[selectedUnit.id]?.drill ? (
                        <View style={styles.donePill}><Text style={styles.donePillText}>DONE ✓</Text></View>
                      ) : null}
                    </View>
                    <Text style={styles.actionDesc}>
                      Guided zero-pen strike engine with ghost times & traps
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#CECECE" />
                </TouchableOpacity>

                {/* 3. SPEED TEST */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => {
                    const u = selectedUnit;
                    setSelectedUnit(null);
                    navigation.navigate('UnitSpeedTest', { chapterId: u.id });
                  }}
                  style={styles.actionCard}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: '#FFF0DB' }]}>
                    <Clock size={24} color="#FF9600" strokeWidth={2.5} />
                  </View>
                  <View style={styles.actionBody}>
                    <View style={styles.actionTitleRow}>
                      <Text style={styles.actionTitle}>⏱️ SPEED TEST</Text>
                      {unitProgress?.[selectedUnit.id]?.speed ? (
                        <View style={styles.donePill}><Text style={styles.donePillText}>DONE ✓</Text></View>
                      ) : null}
                    </View>
                    <Text style={styles.actionDesc}>
                      5 MCQs in 90s • Tier-1 Exam marking (+2 / -0.5)
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#CECECE" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 80,
  },
  topBanner: {
    backgroundColor: Colors.greenFace,
    borderBottomWidth: 5,
    borderBottomColor: Colors.greenLip,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flex: 1,
    gap: 3,
  },
  bannerKicker: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    lineHeight: 24,
  },
  bannerDesc: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  guidebookBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  guidebookText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  coachBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  coachAvatar: {
    fontSize: 36,
  },
  bubbleCard: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
  },
  bubbleText: {
    color: '#4B4B4B',
    fontWeight: '600',
    fontSize: 12.5,
    lineHeight: 18,
  },
  bubbleTail: {
    position: 'absolute',
    left: -10,
    top: 14,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 10,
    borderRightColor: '#E5E5E5',
  },
  phaseBanner: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderBottomWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  phaseLeft: {
    flex: 1,
    gap: 2,
  },
  phaseKicker: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '900',
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  phaseTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 17,
  },
  phaseDesc: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontSize: 11.5,
    lineHeight: 15,
  },
  phaseIcon: {
    fontSize: 28,
    marginLeft: 8,
  },
  pathArea: {
    marginTop: 10,
    gap: 16,
  },
  nodeRow: {
    width: 220,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    marginVertical: 4,
  },
  tooltip: {
    position: 'absolute',
    top: -36,
    backgroundColor: '#1CB0F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    zIndex: 10,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  tooltipNub: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderTopWidth: 6,
    borderTopColor: '#1CB0F6',
  },
  ringWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeHalo: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  ringInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.greenFace,
    borderBottomWidth: 6,
    borderBottomColor: Colors.greenLip,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bossBtn: {
    backgroundColor: Colors.goldFace,
    borderBottomColor: Colors.goldLip,
  },
  completedBtn: {
    backgroundColor: '#58CC02',
    borderBottomColor: '#58A700',
  },
  nodeBtnLocked: {
    backgroundColor: '#E5E5E5',
    borderBottomColor: '#CECECE',
  },
  nodeSpecular: {
    position: 'absolute',
    top: 4,
    left: 12,
    right: 12,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  crownRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  labelCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'flex-start',
    gap: 4,
  },
  bossCard: {
    borderColor: '#FFD699',
    borderBottomColor: Colors.goldLip,
    backgroundColor: '#FFFBF0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  diffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  diffBadgeText: {
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  cardCountText: {
    color: '#AFAFAF',
    fontWeight: '800',
    fontSize: 10,
  },
  nodeTitle: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 13,
    lineHeight: 17,
  },
  tacticChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    width: '100%',
  },
  tacticChipText: {
    color: '#2E7D32',
    fontWeight: '800',
    fontSize: 10,
  },
  miniDotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    width: '100%',
  },
  miniDot: {
    flex: 1,
    paddingVertical: 3,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    alignItems: 'center',
  },
  miniDotActive: {
    backgroundColor: '#E8F9DB',
    borderWidth: 1,
    borderColor: '#58CC02',
  },
  miniDotText: {
    color: '#AFAFAF',
    fontSize: 8.5,
    fontWeight: '900',
  },
  miniDotTextActive: {
    color: '#2E7D32',
  },
  chestRow: {
    width: 220,
    alignItems: 'center',
    marginVertical: 8,
  },
  chestBtn: {
    backgroundColor: '#FFF0DB',
    borderWidth: 2,
    borderColor: '#FFD699',
    borderBottomWidth: 4,
    borderBottomColor: '#E07800',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 4,
  },
  chestBadge: {
    backgroundColor: Colors.goldFace,
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chestBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  sheetTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetBadge: {
    backgroundColor: '#E8F9DB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sheetBadgeText: {
    color: '#2E7D32',
    fontWeight: '900',
    fontSize: 10,
  },
  sheetPhaseText: {
    color: '#AFAFAF',
    fontWeight: '800',
    fontSize: 10,
  },
  sheetTitle: {
    color: '#4B4B4B',
    fontSize: 17,
    fontWeight: '900',
  },
  sheetTactic: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  actionList: {
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    borderRadius: 18,
    padding: 14,
    gap: 14,
  },
  actionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 14,
  },
  actionDesc: {
    color: '#777777',
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 15,
  },
  donePill: {
    backgroundColor: '#E8F9DB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  donePillText: {
    color: '#2E7D32',
    fontWeight: '900',
    fontSize: 9,
  },
});
