import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FSRSMemory, currentRetrievability, initMemory, reviewMemory, FSRSGrade } from '../utils/fsrs';

export type TrapKind = 'baseConfusion' | 'misread' | 'calcSlip' | 'formulaTrap';

export interface GameState {
  xp: number;
  gems: number;
  streakDays: number;
  freezes: number;
  flowMultiplier: number;
  comboCount: number;
  bestCombo: number;
  ghostRecords: Record<string, number>;
  fsrs: Record<string, FSRSMemory>;
  trapStats: Record<TrapKind, number>;
  crowns: Record<string, number>;
  solvedCount: number;
  sniperBest: number;
  dojoBest: number;
  tfBest: number;
  unitProgress: Record<string, { learn?: boolean; drill?: boolean; speed?: boolean }>;
}

const DEFAULT_STATE: GameState = {
  xp: 1450,
  gems: 320,
  streakDays: 12,
  freezes: 2,
  flowMultiplier: 1.0,
  comboCount: 0,
  bestCombo: 0,
  ghostRecords: {},
  fsrs: {},
  trapStats: { baseConfusion: 3, misread: 2, calcSlip: 2, formulaTrap: 1 },
  crowns: { 'percentage-ratio': 2, 'profit-loss': 1, 'si-ci': 1, 'ratio-partnership': 0, 'mixture-alligation': 0, 'time-work': 0, geometry: 0, algebra: 0 },
  solvedCount: 0,
  sniperBest: 0,
  dojoBest: 0,
  tfBest: 0,
  unitProgress: {
    'percentage-ratio': { learn: true, drill: true, speed: false },
    'profit-loss': { learn: true, drill: false, speed: false },
  },
};

const STORAGE_KEY = 'quantflow_game_state_v1';

interface GameContextValue extends GameState {
  addXP: (amount: number) => void;
  registerCorrectStep: (questionId: string, secondsTaken: number) => { crushedGhost: boolean; bonus: number };
  registerWrong: (trap: TrapKind) => void;
  bumpCombo: () => void;
  resetFlow: () => void;
  boostMemory: (topicId: string) => void;
  ensureTopic: (topicId: string) => FSRSMemory;
  reviewTopic: (topicId: string, grade: FSRSGrade) => void;
  setGhostIfBetter: (questionId: string, seconds: number) => boolean;
  useFreeze: () => void;
  earnFreeze: () => void;
  setSniperBest: (v: number) => void;
  setDojoBest: (v: number) => void;
  setTfBest: (v: number) => void;
  setUnitActivityCompleted: (chapterId: string, activity: 'learn' | 'drill' | 'speed') => void;
  awardCrown: (chapterId: string) => void;
  resetAll: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setState({ ...DEFAULT_STATE, ...parsed });
        }
      } catch {
        // keep defaults
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const addXP = useCallback((amount: number) => {
    setState((s) => ({
      ...s,
      xp: s.xp + Math.round(amount),
      gems: s.gems + Math.max(0, Math.floor(amount / 10)),
    }));
  }, []);

  const bumpCombo = useCallback(() => {
    setState((s) => {
      const combo = s.comboCount + 1;
      const flow = Math.min(5, 1 + Math.floor(combo / 2) * 0.5);
      return { ...s, comboCount: combo, bestCombo: Math.max(s.bestCombo, combo), flowMultiplier: flow };
    });
  }, []);

  const resetFlow = useCallback(() => {
    setState((s) => ({ ...s, comboCount: 0, flowMultiplier: 1.0 }));
  }, []);

  const registerCorrectStep = useCallback(
    (questionId: string, secondsTaken: number) => {
      const s = stateRef.current;
      const prevGhost = s.ghostRecords[questionId];
      const crushedGhost = prevGhost == null || secondsTaken < prevGhost;
      const bonus = prevGhost != null && secondsTaken < prevGhost ? 20 : 0;
      const flowBonus = Math.round(10 * s.flowMultiplier);
      const nextCombo = s.comboCount + 1;
      const nextFlow = Math.min(5, 1 + Math.floor(nextCombo / 2) * 0.5);

      setState((curr) => {
        const pGhost = curr.ghostRecords[questionId];
        return {
          ...curr,
          xp: curr.xp + 10 + flowBonus + bonus,
          gems: curr.gems + (crushedGhost ? 2 : 1),
          comboCount: nextCombo,
          bestCombo: Math.max(curr.bestCombo, nextCombo),
          flowMultiplier: nextFlow,
          ghostRecords: { ...curr.ghostRecords, [questionId]: Math.min(pGhost ?? secondsTaken, secondsTaken) },
          solvedCount: curr.solvedCount + 1,
        };
      });
      return { crushedGhost, bonus };
    },
    []
  );

  const registerWrong = useCallback((trap: TrapKind) => {
    setState((s) => ({
      ...s,
      comboCount: 0,
      flowMultiplier: 1.0,
      trapStats: { ...s.trapStats, [trap]: s.trapStats[trap] + 1 },
    }));
  }, []);

  const ensureTopic = useCallback(
    (topicId: string): FSRSMemory => {
      const existing = state.fsrs[topicId];
      if (existing) return existing;
      const fresh = initMemory();
      setState((s) => ({ ...s, fsrs: { ...s.fsrs, [topicId]: fresh } }));
      return fresh;
    },
    [state.fsrs]
  );

  const reviewTopic = useCallback((topicId: string, grade: FSRSGrade) => {
    setState((s) => {
      const mem = s.fsrs[topicId] ?? initMemory();
      const next = reviewMemory(mem, grade);
      return { ...s, fsrs: { ...s.fsrs, [topicId]: next } };
    });
  }, []);

  const boostMemory = useCallback((topicId: string) => {
    setState((s) => {
      const mem = s.fsrs[topicId] ?? initMemory();
      const boosted: FSRSMemory = {
        ...mem,
        stability: Math.round(mem.stability * 2.5 * 100) / 100,
        difficulty: Math.max(1, mem.difficulty - 0.5),
        lastReviewedAt: Date.now(),
        reps: mem.reps + 1,
      };
      return {
        ...s,
        fsrs: { ...s.fsrs, [topicId]: boosted },
        xp: s.xp + 15,
        gems: s.gems + 2,
      };
    });
  }, []);

  const setGhostIfBetter = useCallback((questionId: string, seconds: number) => {
    const prev = stateRef.current.ghostRecords[questionId];
    if (prev == null || seconds < prev) {
      setState((s) => ({ ...s, ghostRecords: { ...s.ghostRecords, [questionId]: seconds } }));
      return true;
    }
    return false;
  }, []);

  const useFreeze = useCallback(() => {
    setState((s) => ({ ...s, freezes: Math.max(0, s.freezes - 1) }));
  }, []);
  const earnFreeze = useCallback(() => {
    setState((s) => ({ ...s, freezes: s.freezes + 1, gems: Math.max(0, s.gems - 50) }));
  }, []);

  const setSniperBest = useCallback((v: number) => {
    setState((s) => ({ ...s, sniperBest: Math.max(s.sniperBest, v) }));
  }, []);
  const setDojoBest = useCallback((v: number) => {
    setState((s) => ({ ...s, dojoBest: Math.max(Number.isFinite(s.dojoBest) ? s.dojoBest : 0, v) }));
  }, []);

  const setTfBest = useCallback((v: number) => {
    setState((s) => ({ ...s, tfBest: Math.max(s.tfBest ?? 0, v) }));
  }, []);

  const setUnitActivityCompleted = useCallback((chapterId: string, activity: 'learn' | 'drill' | 'speed') => {
    setState((s) => {
      const cur = s.unitProgress?.[chapterId] || {};
      return {
        ...s,
        unitProgress: {
          ...s.unitProgress,
          [chapterId]: {
            ...cur,
            [activity]: true,
          },
        },
      };
    });
  }, []);

  const awardCrown = useCallback((chapterId: string) => {
    setState((s) => ({
      ...s,
      crowns: { ...s.crowns, [chapterId]: Math.min(5, (s.crowns[chapterId] ?? 0) + 1) },
    }));
  }, []);

  const resetAll = useCallback(() => setState(DEFAULT_STATE), []);

  const value = useMemo<GameContextValue>(
    () => ({
      ...state,
      addXP,
      registerCorrectStep,
      registerWrong,
      bumpCombo,
      resetFlow,
      boostMemory,
      ensureTopic,
      reviewTopic,
      setGhostIfBetter,
      useFreeze,
      earnFreeze,
      setSniperBest,
      setDojoBest,
      setTfBest,
      setUnitActivityCompleted,
      awardCrown,
      resetAll,
    }),
    [
      state,
      addXP,
      registerCorrectStep,
      registerWrong,
      bumpCombo,
      resetFlow,
      boostMemory,
      ensureTopic,
      reviewTopic,
      setGhostIfBetter,
      useFreeze,
      earnFreeze,
      setSniperBest,
      setDojoBest,
      setTfBest,
      setUnitActivityCompleted,
      awardCrown,
      resetAll,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  // patch setDojoBest closure that referenced helper incorrectly — redefine safely
  return ctx;
}

export function getRetrievabilityFor(mem: FSRSMemory | undefined): number {
  if (!mem) return 1;
  return currentRetrievability(mem);
}
