import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Clock, RotateCw, Trophy, Zap } from 'lucide-react-native';
import { DOJO_LEVELS, DojoCardItem, DojoLevelData } from '../data/dojoLevelsData';
import { useGame } from '../context/GameContext';
import { Colors, Radii } from '../theme/colors';
import Tactile3DButton from '../components/Tactile3DButton';

function FlipCard({ item }: { item: DojoCardItem }) {
  const [flip, setFlip] = useState(false);
  const rot = useSharedValue(0);
  const { addXP } = useGame();

  const style = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rot.value}deg` }],
  }));

  const onCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    rot.value = withTiming(90, { duration: 110 });
    setTimeout(() => {
      setFlip((f) => {
        if (!f) addXP(5);
        return !f;
      });
      rot.value = withTiming(0, { duration: 130 });
    }, 115);
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onCardPress} style={styles.gridCard}>
      <Animated.View style={[styles.gridInner, style, flip && styles.gridFlipped]}>
        {!flip ? (
          <>
            <Text style={styles.gridBase} numberOfLines={1} adjustsFontSizeToFit>
              {item.front}
            </Text>
            <View style={styles.tapPill}>
              <RotateCw size={10} color="#AFAFAF" />
              <Text style={styles.gridTap}>FLIP</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.gridPct} numberOfLines={1} adjustsFontSizeToFit>
              {item.primary}
            </Text>
            {item.secondary ? (
              <Text style={styles.gridDec} numberOfLines={1} adjustsFontSizeToFit>
                {item.secondary}
              </Text>
            ) : null}
            {item.detail ? (
              <Text style={styles.gridMul} numberOfLines={2}>
                {item.detail}
              </Text>
            ) : null}
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PRIME_FILTERS = ['All', '13', '17', '19', '23', '29', '31', '37', '41', '43', '47'];

export default function FractionDojoScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'grid' | 'blitz'>('grid');
  const [selectedLevelId, setSelectedLevelId] = useState<string>('fractions');
  const [primeFilter, setPrimeFilter] = useState<string>('All');
  const { addXP, setDojoBest, dojoBest } = useGame();

  const currentLevel: DojoLevelData = useMemo(() => {
    return DOJO_LEVELS.find((lvl) => lvl.id === selectedLevelId) || DOJO_LEVELS[0];
  }, [selectedLevelId]);

  // Display cards (with optional prime filter for level 4)
  const displayCards = useMemo(() => {
    if (currentLevel.id === 'prime-tables-50' && primeFilter !== 'All') {
      const p = parseInt(primeFilter, 10);
      return currentLevel.cards.filter((c) => c.primeBase === p);
    }
    return currentLevel.cards;
  }, [currentLevel, primeFilter]);

  // Blitz state for current level
  const [activeBlitzPairs, setActiveBlitzPairs] = useState<{ left: string; right: string }[]>(
    () => shuffle(currentLevel.blitzPairs).slice(0, 5)
  );

  const blitzLeft = useMemo(() => activeBlitzPairs.map((p) => p.left), [activeBlitzPairs]);
  const blitzRightMap = useMemo(() => {
    const map: Record<string, string> = {};
    activeBlitzPairs.forEach((p) => {
      map[p.left] = p.right;
    });
    return map;
  }, [activeBlitzPairs]);

  const [rightOrder, setRightOrder] = useState<string[]>(() =>
    shuffle(activeBlitzPairs.map((p) => p.right))
  );
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [selRight, setSelRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [combo, setCombo] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);

  // Re-sync blitz whenever level changes
  useEffect(() => {
    const fresh = shuffle(currentLevel.blitzPairs).slice(0, 5);
    setActiveBlitzPairs(fresh);
    setRightOrder(shuffle(fresh.map((p) => p.right)));
    setMatched([]);
    setSelLeft(null);
    setSelRight(null);
    setRunning(false);
    setSeconds(60);
    setScore(0);
    setCombo(0);
  }, [currentLevel]);

  const comboScale = useSharedValue(1);
  const comboStyle = useAnimatedStyle(() => ({
    transform: [{ scale: comboScale.value }],
  }));

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      setDojoBest(score);
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [running, seconds, score, setDojoBest]);

  const startBlitz = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const fresh = shuffle(currentLevel.blitzPairs).slice(0, 5);
    setActiveBlitzPairs(fresh);
    setRightOrder(shuffle(fresh.map((p) => p.right)));
    setMatched([]);
    setSelLeft(null);
    setSelRight(null);
    setCombo(0);
    setScore(0);
    setSeconds(60);
    setRunning(true);
  };

  const tryMatch = (left: string | null, right: string | null) => {
    if (!left || !right) return;
    if (blitzRightMap[left] === right) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const gained = 10 + combo * 5;
      addXP(gained);
      const nCombo = combo + 1;
      setCombo(nCombo);
      comboScale.value = withSpring(1.3, { damping: 8, stiffness: 350 }, () => {
        comboScale.value = withSpring(1);
      });
      setScore((s) => s + 1);
      const updated = [...matched, left];
      setMatched(updated);

      if (updated.length >= blitzLeft.length) {
        setTimeout(() => {
          setMatched([]);
          // Pick a random batch from level blitz pairs if more than 5 exist
          const shuffledPairs = shuffle(currentLevel.blitzPairs);
          const nextBatch = shuffledPairs.slice(0, 5);
          setActiveBlitzPairs(nextBatch);
          setRightOrder(shuffle(nextBatch.map((p) => p.right)));
        }, 350);
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setCombo(0);
    }
    setSelLeft(null);
    setSelRight(null);
  };

  const onLeft = (item: string) => {
    if (!running || matched.includes(item)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (selLeft === item) {
      setSelLeft(null);
      return;
    }
    setSelLeft(item);
    if (selRight) tryMatch(item, selRight);
  };

  const onRight = (item: string) => {
    if (!running) return;
    const leftFor = Object.keys(blitzRightMap).find((k) => blitzRightMap[k] === item);
    if (leftFor && matched.includes(leftFor)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (selRight === item) {
      setSelRight(null);
      return;
    }
    setSelRight(item);
    if (selLeft) tryMatch(selLeft, item);
  };

  const remaining = useMemo(
    () => blitzLeft.filter((item) => !matched.includes(item)),
    [blitzLeft, matched]
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top + 8, 16),
          paddingBottom: 40 + insets.bottom,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Duolingo Segmented Mode Tabs: Reference Deck vs Match Madness */}
      <View style={styles.switch}>
        <TouchableOpacity
          onPress={() => setMode('grid')}
          style={[styles.tab, mode === 'grid' && styles.tabOn]}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, mode === 'grid' && styles.tabTextOn]}>
            REFERENCE DECK
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('blitz')}
          style={[styles.tab, mode === 'blitz' && styles.tabOn]}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, mode === 'blitz' && styles.tabTextOn]}>
            MATCH MADNESS ⚡
          </Text>
        </TouchableOpacity>
      </View>

      {/* Levels & Pages Selector: Fractions, Squares 10-20, Squares 21-50, Cubes 1-30, Primes */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.levelScroll}
      >
        {DOJO_LEVELS.map((lvl) => {
          const isSelected = selectedLevelId === lvl.id;
          return (
            <TouchableOpacity
              key={lvl.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setSelectedLevelId(lvl.id);
              }}
              style={[styles.levelPill, isSelected && styles.levelPillSelected]}
              activeOpacity={0.85}
            >
              <Text style={styles.levelIcon}>{lvl.icon}</Text>
              <Text style={[styles.levelPillText, isSelected && styles.levelPillTextSelected]}>
                {lvl.shortLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {mode === 'grid' ? (
        <>
          {/* Level Header Info */}
          <View style={styles.dojoHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.h1}>{currentLevel.title}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{currentLevel.badge}</Text>
              </View>
            </View>
            <Text style={styles.sub}>{currentLevel.description}</Text>
          </View>

          {/* Optional Prime Filter Bar (for Level 4) */}
          {currentLevel.id === 'prime-tables-50' ? (
            <View style={styles.primeFilterContainer}>
              <Text style={styles.filterTitle}>SELECT PRIME TABLE:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.primeScroll}>
                {PRIME_FILTERS.map((p) => {
                  const isCur = primeFilter === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setPrimeFilter(p);
                      }}
                      style={[styles.primePill, isCur && styles.primePillActive]}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.primePillText, isCur && styles.primePillTextActive]}>
                        {p === 'All' ? 'ALL PRIMES' : `${p} TABLE`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* 3-Column 3D Tactile Flip Cards Grid */}
          <View style={styles.grid}>
            {displayCards.map((card) => (
              <FlipCard key={card.id} item={card} />
            ))}
          </View>
        </>
      ) : (
        <>
          {/* Match Madness Mode */}
          <View style={styles.blitzHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>Match Madness ⚡</Text>
              <Text style={styles.sub}>
                {currentLevel.shortLabel} • Record: {Math.max(dojoBest, score)} pairs
              </Text>
            </View>

            <View style={[styles.clock, seconds <= 10 && styles.clockUrgent]}>
              <Clock size={16} color="#FFFFFF" strokeWidth={3} />
              <Text style={styles.clockText}>{seconds}s</Text>
            </View>
          </View>

          {/* Animated Combo Pill */}
          <Animated.View style={[styles.comboPill, comboStyle]}>
            <Zap size={16} color={Colors.orangeFace} fill={Colors.orangeFace} />
            <Text style={styles.comboText}>
              Combo x{combo} {combo >= 3 ? '• STREAK BOOST!' : ''}
            </Text>
          </Animated.View>

          {!running && seconds === 60 && score === 0 ? (
            <View style={styles.preBlitzBox}>
              <Text style={styles.preBlitzTitle}>60-Second {currentLevel.shortLabel} Challenge</Text>
              <Text style={styles.howto}>
                Tap an item on the left, then tap its matching value on the right. Build high combos to earn massive bonus XP!
              </Text>
              <Tactile3DButton
                title={`START ${currentLevel.shortLabel.toUpperCase()} MATCH (+15 XP)`}
                onPress={startBlitz}
                faceColor={Colors.greenFace}
                lipColor={Colors.greenLip}
              />
            </View>
          ) : null}

          {!running && seconds <= 0 ? (
            <View style={styles.over}>
              <Trophy size={42} color={Colors.goldFace} />
              <Text style={styles.overTitle}>TIME UP! {score} PAIRS MATCHED</Text>
              <Text style={styles.overSub}>
                Personal Best: {Math.max(dojoBest, score)} pairs • Daily practice builds instant exam calculation reflexes.
              </Text>
              <Tactile3DButton
                title="PLAY AGAIN"
                onPress={startBlitz}
                faceColor={Colors.greenFace}
                lipColor={Colors.greenLip}
              />
            </View>
          ) : null}

          {(running || score > 0) && seconds > 0 ? (
            <View style={styles.matchGrid}>
              <View style={styles.col}>
                {blitzLeft.map((f) => {
                  const done = matched.includes(f);
                  const sel = selLeft === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      onPress={() => onLeft(f)}
                      style={[
                        styles.matchCard,
                        done && styles.done,
                        sel && styles.sel,
                      ]}
                      disabled={done || !running}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[styles.matchText, done && styles.doneText, sel && styles.selText]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {done ? '✓' : f}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.col}>
                {rightOrder.map((p) => {
                  const leftFor = Object.keys(blitzRightMap).find(
                    (k) => blitzRightMap[k] === p
                  );
                  const done = leftFor ? matched.includes(leftFor) : false;
                  const sel = selRight === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => onRight(p)}
                      style={[
                        styles.matchCard,
                        done && styles.done,
                        sel && styles.sel,
                      ]}
                      disabled={done || !running}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[styles.matchText, done && styles.doneText, sel && styles.selText]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {done ? '✓' : p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {remaining.length > 0 && running ? (
            <Text style={styles.remain}>{remaining.length} pairs remaining…</Text>
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
    paddingBottom: 85,
  },
  switch: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: Radii.pill,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.pill,
    alignItems: 'center',
  },
  tabOn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabText: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tabTextOn: {
    color: '#1CB0F6',
  },
  levelScroll: {
    gap: 8,
    marginTop: 14,
    paddingVertical: 4,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    gap: 6,
  },
  levelPillSelected: {
    backgroundColor: '#DDF4FF',
    borderColor: '#84D8FF',
    borderBottomColor: '#1CB0F6',
  },
  levelIcon: {
    fontSize: 13,
  },
  levelPillText: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 12,
  },
  levelPillTextSelected: {
    color: '#1899D6',
  },
  dojoHeader: {
    marginTop: 14,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  h1: {
    color: '#4B4B4B',
    fontSize: 20,
    fontWeight: '900',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    color: '#777777',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  sub: {
    color: '#777777',
    fontWeight: '600',
    lineHeight: 18,
    fontSize: 13,
  },
  primeFilterContainer: {
    marginTop: 12,
    gap: 6,
  },
  filterTitle: {
    color: '#AFAFAF',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  primeScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  primePill: {
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  primePillActive: {
    backgroundColor: '#DDF4FF',
    borderColor: '#1CB0F6',
  },
  primePillText: {
    color: '#777777',
    fontWeight: '800',
    fontSize: 11,
  },
  primePillTextActive: {
    color: '#1899D6',
    fontWeight: '900',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  gridCard: {
    width: '31%',
  },
  gridInner: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    borderRadius: 16,
    padding: 8,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridFlipped: {
    backgroundColor: '#D7FFB8',
    borderColor: '#88E23B',
    borderBottomColor: '#58A700',
  },
  gridBase: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 20,
    textAlign: 'center',
  },
  tapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  gridTap: {
    color: '#AFAFAF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  gridPct: {
    color: '#58A700',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
  },
  gridDec: {
    color: '#4B4B4B',
    fontWeight: '800',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  gridMul: {
    color: '#777777',
    fontWeight: '700',
    fontSize: 9,
    marginTop: 3,
    textAlign: 'center',
    lineHeight: 12,
  },
  blitzHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  clock: {
    backgroundColor: Colors.redFace,
    borderBottomWidth: 4,
    borderBottomColor: Colors.redLip,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockUrgent: {
    backgroundColor: '#D61818',
  },
  clockText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  comboPill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0DB',
    borderWidth: 2,
    borderColor: '#FFD699',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comboText: {
    color: Colors.orangeLip,
    fontWeight: '900',
    fontSize: 12,
  },
  preBlitzBox: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  preBlitzTitle: {
    color: '#4B4B4B',
    fontSize: 18,
    fontWeight: '900',
  },
  howto: {
    color: '#777777',
    fontWeight: '600',
    lineHeight: 20,
    fontSize: 13,
  },
  over: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  overTitle: {
    color: '#4B4B4B',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  overSub: {
    color: '#777777',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  matchGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  col: {
    flex: 1,
    gap: 10,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#CECECE',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {
    backgroundColor: '#D7FFB8',
    borderColor: '#58CC02',
    borderBottomColor: '#58A700',
  },
  doneText: {
    color: '#58A700',
    fontWeight: '900',
  },
  sel: {
    backgroundColor: '#DDF4FF',
    borderColor: '#1CB0F6',
    borderBottomColor: '#1899D6',
  },
  selText: {
    color: '#1899D6',
  },
  matchText: {
    color: '#4B4B4B',
    fontWeight: '900',
    fontSize: 17,
  },
  remain: {
    color: '#777777',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
  },
});
