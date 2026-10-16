// FSRS v4 (simplified, production-faithful) helpers.
// Retrievability: R = exp(-t / S), t in days, S = stability in days.
// Stability & Difficulty updates follow FSRS-4 intuitions:
// - successful recall grows S (more when R was low = desirable difficulty)
// - lapse shrinks S, bumps D
// - D drifts toward grade-implied target.

export type FSRSGrade = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

export interface FSRSMemory {
  stability: number; // S in days
  difficulty: number; // D 1..10
  lastReviewedAt: number; // epoch ms
  reps: number;
  lapses: number;
}

export function initMemory(): FSRSMemory {
  return {
    stability: 1.0,
    difficulty: 5.0,
    lastReviewedAt: Date.now(),
    reps: 0,
    lapses: 0,
  };
}

export function daysSince(lastReviewedAt: number, now: number = Date.now()): number {
  const ms = Math.max(0, now - lastReviewedAt);
  return ms / (1000 * 60 * 60 * 24);
}

/** R = exp(-t / S), clamped 0..1 */
export function retrievability(tDays: number, stability: number): number {
  const s = Math.max(0.05, stability);
  const t = Math.max(0, tDays);
  return Math.exp(-t / s);
}

export function currentRetrievability(mem: FSRSMemory, now: number = Date.now()): number {
  return retrievability(daysSince(mem.lastReviewedAt, now), mem.stability);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * FSRS-4 style stability update.
 * - grade 1 (Again): big drop
 * - grade 2/3/4: growth scaled by difficulty & retrievability
 */
export function updateStability(
  stability: number,
  difficulty: number,
  r: number,
  grade: FSRSGrade
): number {
  const S = Math.max(0.1, stability);
  const D = clamp(difficulty, 1, 10);
  const R = clamp(r, 0.01, 1);

  if (grade === 1) {
    // lapse: stability collapses, harder material collapses more
    const factor = 0.75 - 0.04 * D; // 0.35..0.71
    return clamp(S * factor, 0.1, 365);
  }

  // success: SInc = (1 + a * (11-D)/10) * (1 + b*(1-R)) * gradeBonus
  const a = 1.2;
  const b = 2.0;
  const gradeBonus = grade === 4 ? 1.35 : grade === 3 ? 1.0 : 0.75;
  const diffFactor = 1 + (a * (11 - D)) / 10;
  const retrFactor = 1 + b * (1 - R);
  const next = S * diffFactor * retrFactor * gradeBonus * 0.55;
  return clamp(next, 0.2, 365);
}

export function updateDifficulty(difficulty: number, grade: FSRSGrade): number {
  const D = clamp(difficulty, 1, 10);
  // linear-mean reversion toward grade target
  const target = grade === 1 ? 8.2 : grade === 2 ? 6.0 : grade === 4 ? 3.2 : 4.6;
  const next = D + 0.35 * (target - D);
  return clamp(Math.round(next * 10) / 10, 1, 10);
}

export function reviewMemory(mem: FSRSMemory, grade: FSRSGrade, now: number = Date.now()): FSRSMemory {
  const t = daysSince(mem.lastReviewedAt, now);
  const r = retrievability(t, mem.stability);
  const nextS = updateStability(mem.stability, mem.difficulty, r, grade);
  const nextD = updateDifficulty(mem.difficulty, grade);
  return {
    stability: Math.round(nextS * 100) / 100,
    difficulty: nextD,
    lastReviewedAt: now,
    reps: mem.reps + 1,
    lapses: mem.lapses + (grade === 1 ? 1 : 0),
  };
}

/** Next review interval in days to hold R >= target (default 0.9) */
export function nextIntervalDays(stability: number, targetR = 0.9): number {
  const S = Math.max(0.05, stability);
  const t = -S * Math.log(clamp(targetR, 0.5, 0.99));
  return Math.max(0.25, Math.round(t * 10) / 10);
}

export function stabilityMultiplierPreview(stability: number): number {
  // UI helper: boosting memory multiplies S by ~2.5x
  return Math.round(stability * 2.5 * 100) / 100;
}
