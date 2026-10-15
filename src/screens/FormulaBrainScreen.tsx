import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Activity, AlertTriangle, CheckCircle2, Dices, Flame, Radio, RefreshCw, ShieldAlert, Sparkles, Target, Trophy, Zap } from 'lucide-react-native';
import { FORMULA_CHAPTERS } from '../data/formulaData';
import { useGame, TrapKind } from '../context/GameContext';
import { currentRetrievability, nextIntervalDays } from '../utils/fsrs';
import { useAutoOTAUpdate } from '../utils/otaUpdates';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from '../components/Tactile3DButton';

const TRAP_CONFIG: Record<TrapKind, { label: string; desc: string; icon: string; color: string }> = {
  misread: {
    label: 'QUESTION MISREADS',
    desc: 'Answering SP instead of CP, or full chord instead of segment.',
    icon: '👁️',
    color: '#FF4B4B',
  },
  baseConfusion: {
    label: 'BASE CONFUSION',
    desc: 'Dividing by old base instead of new base in % and ratio jumps.',
    icon: '⚖️',
    color: '#FF9600',
  },
  calcSlip: {
    label: 'CALCULATION SLIPS',
    desc: 'Mental arithmetic sign slips or division errors under speed stress.',
    icon: '⚡',
    color: '#1CB0F6',
  },
  formulaTrap: {
    label: 'FORMULA TRAPS',
    desc: 'Missing conjugate sign flips or forgetting the 3k term in cubes.',
    icon: '📐',
    color: '#AF70FF',
  },
};

export default function FormulaBrainScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { fsrs, trapStats } = useGame();
  const [activeTab, setActiveTab] = useState<'due' | 'chaos'>('due');
  const ota = useAutoOTAUpdate();

  // Compute FSRS rows across all formula chapters
  const rows = useMemo(() => {
    return FORMULA_CHAPTERS.map((ch) => {
      const mem = fsrs[ch.id];
      const S = mem?.stability ?? 1.2;
      const D = mem?.difficulty ?? 4.5;
      const R = mem ? currentRetrievability(mem) : 0.82;
      const pct = Math.round(R * 100);
      return {
        ...ch,
        S,
        D,
        R: pct,
        interval: nextIntervalDays(S),
        reps: mem?.reps ?? 0,
        isDue: pct < 88,
      };
    });
  }, [fsrs]);

  // Sort weakest-first (lowest retrievability at top)
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => a.R - b.R);
  }, [rows]);

  // Today's review items count: due formula chapters + standard daily Dojo reflex items
  const dueFormulaCount = useMemo(() => rows.filter((r) => r.isDue).length, [rows]);
  const dojoTableCount = 2; // Daily speed recall: squares & cubes
  const totalDueCount = dueFormulaCount + dojoTableCount;

  // Average retention across entire syllabus
  const avgRetention = Math.round(
    rows.reduce((acc, r) => acc + r.R, 0) / Math.max(1, rows.length)
  );

  // Trap statistics analysis
  const topTrap = useMemo(() => {
    const entries = Object.entries(trapStats) as [TrapKind, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const best = entries[0] || ['misread', 0];
    return {
      kind: best[0] as TrapKind,
      count: best[1],
      config: TRAP_CONFIG[best[0] as TrapKind] || TRAP_CONFIG.misread,
    };
  }, [trapStats]);

  const startDueReview = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    navigation.navigate('FormulaFlipSession', { chapterId: 'all' });
  };

  const startChaosFlip = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    navigation.navigate('FormulaFlipSession', { chapterId: 'all' });
  };

const TRAP_TARGET_CHAPTERS: Record<TrapKind, string> = {
  misread: 'geometry',
  baseConfusion: 'percentage-ratio',
  calcSlip: 'speed-distance',
  formulaTrap: 'algebra',
};

  const startTrapDrill = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const targetChapter = TRAP_TARGET_CHAPTERS[topTrap.kind] || 'percentage-ratio';
    navigation.navigate('LessonStrike', { chapterId: targetChapter });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 6, 16),
          paddingBottom: 90 + insets.bottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Segmented Switch: DUE REVIEW vs CHAOS FLIP */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'due' && styles.segmentBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setActiveTab('due');
          }}
          activeOpacity={0.85}
        >
          <Zap size={16} color={activeTab === 'due' ? '#FFFFFF' : '#777777'} strokeWidth={2.6} />
          <Text style={[styles.segmentText, activeTab === 'due' && styles.segmentTextActive]}>
            DUE REVIEW 🔄
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'chaos' && styles.segmentBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setActiveTab('chaos');
          }}
          activeOpacity={0.85}
        >
          <Dices size={16} color={activeTab === 'chaos' ? '#FFFFFF' : '#777777'} strokeWidth={2.6} />
          <Text style={[styles.segmentText, activeTab === 'chaos' && styles.segmentTextActive]}>
            CHAOS FLIP 🎲
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= MODE: DUE REVIEW ================= */}
      {activeTab === 'due' ? (
        <>
          {/* "Today's Review" Hero Banner */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroIconBox}>
                <Sparkles size={26} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTag}>TODAY'S REVIEW</Text>
                <Text style={styles.heroTitle}>
                  {totalDueCount > 0 ? `${totalDueCount} Items Due Today` : 'All Caught Up! ✨'}
                </Text>
              </View>
              <View style={styles.avgBadge}>
                <Text style={styles.avgBadgeText}>{avgRetention}% Avg</Text>
              </View>
            </View>

            <Text style={styles.heroSub}>
              Interleaved spaced repetition session across vulnerable formulas ({dueFormulaCount}) and Dojo tables ({dojoTableCount}). Daily review cements exam memory.
            </Text>

            <Tactile3DButton
              title={`START TODAY'S REVIEW (${totalDueCount} DUE) (+30 XP)`}
              onPress={startDueReview}
              faceColor={Colors.greenFace}
              lipColor={Colors.greenLip}
            />
          </View>

          {/* Trap Stats Card */}
          <View style={styles.trapCard}>
            <View style={styles.trapHeader}>
              <View style={styles.trapIconBox}>
                <ShieldAlert size={20} color={topTrap.config.color} strokeWidth={2.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trapKicker}>TRAP DIAGNOSTICS</Text>
                <Text style={styles.trapTitle}>Your #1 Exam-Killer: {topTrap.config.label}</Text>
              </View>
            </View>

            <Text style={styles.trapDesc}>{topTrap.config.desc}</Text>

            {/* Trap Count Breakdown Chips */}
            <View style={styles.trapPillRow}>
              {(Object.keys(TRAP_CONFIG) as TrapKind[]).map((kind) => {
                const cfg = TRAP_CONFIG[kind];
                const count = trapStats[kind] || 0;
                const isTop = kind === topTrap.kind;
                return (
                  <View
                    key={kind}
                    style={[
                      styles.trapChip,
                      isTop && { borderColor: cfg.color, backgroundColor: '#FFF5F5' },
                    ]}
                  >
                    <Text style={styles.trapChipIcon}>{cfg.icon}</Text>
                    <Text style={styles.trapChipCount}>{count}</Text>
                    <Text style={styles.trapChipLabel} numberOfLines={1}>
                      {kind === 'baseConfusion' ? 'Base' : kind === 'misread' ? 'Misread' : kind === 'calcSlip' ? 'Calc' : 'Formula'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Tactile3DButton
              title={`DRILL ${topTrap.config.label} PYQS 🎯`}
              onPress={startTrapDrill}
              faceColor={Colors.blueFace}
              lipColor={Colors.blueLip}
              small
            />
          </View>

          {/* FSRS Memory Matrix Header */}
          <View style={styles.matrixHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Activity size={18} color={Colors.blueFace} strokeWidth={2.6} />
              <Text style={styles.matrixTitle}>Retention Matrix (Weakest First)</Text>
            </View>
            <Text style={styles.matrixCount}>{sortedRows.length} Chapters</Text>
          </View>

          {/* Weakest-First Color-Banded Chapter Cards */}
          <View style={{ gap: 10, marginTop: 10 }}>
            {sortedRows.map((r) => {
              const isCrit = r.R < 70;
              const isMid = r.R >= 70 && r.R < 85;
              const isHigh = r.R >= 85;

              let bandColor: string = Colors.greenFace;
              let bandLip: string = Colors.greenLip;
              let bandBg = '#FFFFFF';
              let badgeBg = '#D7FFB8';
              let badgeText = '#58A700';
              let bandLabel = 'SECURE 🛡️';

              if (isCrit) {
                bandColor = Colors.redFace;
                bandLip = Colors.redLip;
                bandBg = '#FFF8F8';
                badgeBg = '#FFDFE0';
                badgeText = '#EA2B2B';
                bandLabel = 'CRITICAL ⚠️';
              } else if (isMid) {
                bandColor = Colors.orangeFace;
                bandLip = Colors.orangeLip;
                bandBg = '#FFFDF7';
                badgeBg = '#FFF0DB';
                badgeText = Colors.orangeLip;
                bandLabel = 'NEEDS REFRESH ⏳';
              }

              return (
                <View
                  key={r.id}
                  style={[
                    styles.memCard,
                    { borderColor: isCrit ? '#FFB8B8' : isMid ? '#FFE0B2' : '#E5E5E5', backgroundColor: bandBg },
                  ]}
                >
                  <View style={styles.memTop}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.memLabel}>
                          {r.icon} {r.title}
                        </Text>
                        <View style={[styles.bandBadge, { backgroundColor: badgeBg }]}>
                          <Text style={[styles.bandBadgeText, { color: badgeText }]}>{bandLabel}</Text>
                        </View>
                      </View>
                      <Text style={styles.memTag}>
                        {r.formulas.length} Formulas • Stability: {r.S.toFixed(1)}d • Next Review: {r.interval}d
                      </Text>
                    </View>

                    <View style={[styles.rBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.rPct, { color: badgeText }]}>{r.R}%</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.rTrack}>
                    <View style={[styles.rFill, { width: `${r.R}%`, backgroundColor: bandColor }]} />
                  </View>

                  <View style={{ marginTop: 4 }}>
                    <Tactile3DButton
                      title="PRACTICE DECK 🔄"
                      onPress={() => {
                        navigation.navigate('FormulaFlipSession', { chapterId: r.id });
                      }}
                      faceColor={bandColor}
                      lipColor={bandLip}
                      small
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        /* ================= MODE: CHAOS FLIP ================= */
        <View style={{ gap: 14 }}>
          {/* Purple Chaos Mode Hero */}
          <View style={styles.chaosHero}>
            <View style={styles.chaosRow}>
              <View style={styles.diceWrap}>
                <Dices size={28} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chaosTitle}>ALL-CHAPTER CHAOS FLIP</Text>
                <Text style={styles.chaosKicker}>Interleaved Cognitive Recall Gauntlet</Text>
              </View>
            </View>

            <Text style={styles.chaosSub}>
              Cold interleaved flashcards across all 14 syllabus chapters: Arithmetic, Algebra, Geometry, Trigonometry, Mensuration, Number System & DI. Eliminates chapter-cue dependency.
            </Text>

            <Tactile3DButton
              title="START ALL-FORMULA FLIP (+25 XP)"
              onPress={startChaosFlip}
              faceColor={Colors.purpleFace}
              lipColor={Colors.purpleLip}
            />
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.chaosStatsCard}>
            <Text style={styles.chaosStatsTitle}>WHY CHAOS FLIP WORKS FOR SSC CGL</Text>
            <View style={styles.chaosBullet}>
              <CheckCircle2 size={16} color={Colors.greenFace} />
              <Text style={styles.chaosBulletText}>
                The real Tier-1 exam never presents formulas sorted by chapter.
              </Text>
            </View>
            <View style={styles.chaosBullet}>
              <CheckCircle2 size={16} color={Colors.greenFace} />
              <Text style={styles.chaosBulletText}>
                Interleaving forces your brain to identify the governing theorem from scratch.
              </Text>
            </View>
            <View style={styles.chaosBullet}>
              <CheckCircle2 size={16} color={Colors.greenFace} />
              <Text style={styles.chaosBulletText}>
                FSRS algorithm automatically tracks recall lapses and reschedules weaker topics.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Live Over-The-Air (OTA) Sync Card */}
      <View style={styles.otaCard}>
        <View style={styles.otaHeader}>
          <View style={styles.otaIconWrap}>
            <Radio size={20} color={Colors.blueFace} strokeWidth={2.6} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.otaKicker}>OVER-THE-AIR (OTA) SYNC</Text>
            <Text style={styles.otaTitle}>
              {ota.isDownloaded
                ? '⚡ New Update Ready to Apply!'
                : ota.isDownloading
                ? '⬇️ Downloading Live Changes...'
                : ota.isChecking
                ? '🔍 Checking for Updates...'
                : ota.isDev
                ? '⚡ Metro Fast Refresh (Dev Mode)'
                : '✅ QuantFlow is 100% Up-to-Date'}
            </Text>
          </View>
        </View>

        <Text style={styles.otaDesc}>
          {ota.isDownloaded
            ? 'A fresh update bundle has been downloaded to your device. Tap below to reload and activate the latest syllabus, Dojo items, and arena fixes!'
            : 'Changes published from your workspace are instantly retrieved over-the-air without reinstalling the APK.'}
        </Text>

        <View style={styles.otaMetaRow}>
          <Text style={styles.otaMetaText}>
            Channel: <Text style={{ color: '#4B4B4B' }}>{ota.channel || 'production'}</Text>
          </Text>
          <Text style={styles.otaMetaText}>
            Runtime: <Text style={{ color: '#4B4B4B' }}>{ota.runtimeVersion || '1.0.0'}</Text>
          </Text>
        </View>

        {ota.isDownloaded ? (
          <Tactile3DButton
            title="RELOAD NOW TO APPLY CHANGES 🔄"
            onPress={async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              await ota.applyUpdate();
            }}
            faceColor={Colors.greenFace}
            lipColor={Colors.greenLip}
          />
        ) : (
          <Tactile3DButton
            title={ota.isChecking ? 'CHECKING FOR UPDATES...' : 'CHECK FOR OTA UPDATES 🚀'}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              await ota.checkNow();
            }}
            faceColor={Colors.blueFace}
            lipColor={Colors.blueLip}
            disabled={ota.isChecking}
            small
          />
        )}
      </View>

      <View style={{ height: 80 }} />
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
    marginBottom: 14,
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
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.greenFace,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTag: {
    color: '#AFAFAF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#4B4B4B',
    fontSize: 18,
    fontWeight: '900',
  },
  avgBadge: {
    backgroundColor: '#D7FFB8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  avgBadgeText: {
    color: '#58A700',
    fontWeight: '900',
    fontSize: 12,
  },
  heroSub: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  trapCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    gap: 10,
  },
  trapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trapIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trapKicker: {
    color: '#AFAFAF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  trapTitle: {
    color: '#4B4B4B',
    fontSize: 15,
    fontWeight: '900',
  },
  trapDesc: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  trapPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trapChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F9F9F9',
  },
  trapChipIcon: {
    fontSize: 12,
  },
  trapChipCount: {
    fontWeight: '900',
    fontSize: 13,
    color: '#4B4B4B',
  },
  trapChipLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#777777',
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 4,
  },
  matrixTitle: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 14,
  },
  matrixCount: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '700',
  },
  memCard: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  memTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memLabel: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 14,
  },
  bandBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.pill,
  },
  bandBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  memTag: {
    color: '#777777',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 2,
  },
  rBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  rPct: {
    fontWeight: '900',
    fontSize: 14,
  },
  rTrack: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  rFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  chaosHero: {
    backgroundColor: Colors.purpleFace,
    borderRadius: 20,
    borderBottomWidth: 5,
    borderBottomColor: Colors.purpleLip,
    padding: 20,
    gap: 12,
  },
  chaosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diceWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chaosTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.8,
    fontSize: 17,
  },
  chaosKicker: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.9,
  },
  chaosSub: {
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 19,
    fontSize: 13,
    opacity: 0.95,
  },
  chaosStatsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    gap: 12,
  },
  chaosStatsTitle: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.6,
  },
  chaosBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  chaosBulletText: {
    flex: 1,
    color: '#555555',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  otaCard: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    gap: 10,
  },
  otaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  otaIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otaKicker: {
    color: '#AFAFAF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  otaTitle: {
    color: '#4B4B4B',
    fontSize: 15,
    fontWeight: '900',
  },
  otaDesc: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  otaMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  otaMetaText: {
    fontSize: 11,
    color: '#777777',
    fontWeight: '700',
  },
});
