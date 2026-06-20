import { Streak } from '@domain/index';

function createStreak(overrides: Record<string, unknown> = {}) {
  return Streak.create({
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '223e4567-e89b-12d3-a456-426614174001',
    disciplineType: 'devotional' as const,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    graceDayUsed: false,
    graceDayWeekStart: null,
    ...overrides,
  });
}

function makeDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

describe('Streak', () => {
  describe('recordCompletion', () => {
    it('should start streak at 1 on first completion', () => {
      const s = createStreak();
      const { streak } = s.recordCompletion(makeDate('2026-06-01'));

      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(1);
      expect(streak.graceDayUsed).toBe(false);
    });

    it('should not change streak if already completed today', () => {
      const today = makeDate('2026-06-01');
      const s = createStreak({
        currentStreak: 5,
        longestStreak: 5,
        lastCompletedDate: today,
      });

      const { streak } = s.recordCompletion(today);

      expect(streak.currentStreak).toBe(5);
      expect(streak.longestStreak).toBe(5);
    });

    it('should increment streak when completed on consecutive day', () => {
      const yesterday = makeDate('2026-06-01');
      const today = makeDate('2026-06-02');
      const s = createStreak({
        currentStreak: 5,
        longestStreak: 5,
        lastCompletedDate: yesterday,
      });

      const { streak } = s.recordCompletion(today);

      expect(streak.currentStreak).toBe(6);
      expect(streak.longestStreak).toBe(6);
    });

    it('should update longest streak when current exceeds it', () => {
      const yesterday = makeDate('2026-06-01');
      const today = makeDate('2026-06-02');
      const s = createStreak({
        currentStreak: 10,
        longestStreak: 10,
        lastCompletedDate: yesterday,
      });

      const { streak } = s.recordCompletion(today);

      expect(streak.currentStreak).toBe(11);
      expect(streak.longestStreak).toBe(11);
    });

    it('should keep longest streak when current does not exceed it', () => {
      const yesterday = makeDate('2026-06-01');
      const today = makeDate('2026-06-02');
      const s = createStreak({
        currentStreak: 5,
        longestStreak: 20,
        lastCompletedDate: yesterday,
      });

      const { streak } = s.recordCompletion(today);

      expect(streak.currentStreak).toBe(6);
      expect(streak.longestStreak).toBe(20);
    });

    it('should use grace day and keep streak when one day missed (gap=2) and grace not used', () => {
      const twoDaysAgo = makeDate('2026-06-01');
      const today = makeDate('2026-06-03');
      const s = createStreak({
        currentStreak: 5,
        longestStreak: 5,
        lastCompletedDate: twoDaysAgo,
        graceDayUsed: false,
      });

      const { streak } = s.recordCompletion(today);

      expect(streak.currentStreak).toBe(6);
      expect(streak.longestStreak).toBe(6);
      expect(streak.graceDayUsed).toBe(true);
    });

    it('should reset streak when one day missed (gap=2) but grace already used this week', () => {
      const weekStart = makeDate('2026-06-01');
      const twoDaysAgo = makeDate('2026-06-01');
      const today = makeDate('2026-06-03');
      const s = createStreak({
        currentStreak: 5,
        longestStreak: 5,
        lastCompletedDate: twoDaysAgo,
        graceDayUsed: true,
        graceDayWeekStart: weekStart,
      });

      const { streak } = s.recordCompletion(today);

      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(5);
      expect(streak.graceDayUsed).toBe(false);
    });

    it('should reset streak when more than 2 days missed', () => {
      const threeDaysAgo = makeDate('2026-05-30');
      const today = makeDate('2026-06-03');
      const s = createStreak({
        currentStreak: 10,
        longestStreak: 15,
        lastCompletedDate: threeDaysAgo,
      });

      const { streak } = s.recordCompletion(today);

      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(15);
    });

    it('should reset grace day availability in new week', () => {
      const lastWeekStart = makeDate('2026-05-25');
      const twoDaysAgo = makeDate('2026-06-01');
      const today = makeDate('2026-06-03');
      const s = createStreak({
        currentStreak: 5,
        longestStreak: 5,
        lastCompletedDate: twoDaysAgo,
        graceDayUsed: true,
        graceDayWeekStart: lastWeekStart,
      });

      const { streak } = s.recordCompletion(today);

      expect(streak.currentStreak).toBe(6);
      expect(streak.graceDayUsed).toBe(true);
    });

    it('should detect milestone at 7 days', () => {
      const yesterday = makeDate('2026-06-06');
      const today = makeDate('2026-06-07');
      const s = createStreak({
        currentStreak: 6,
        longestStreak: 6,
        lastCompletedDate: yesterday,
      });

      const { milestoneReached } = s.recordCompletion(today);

      expect(milestoneReached).not.toBeNull();
      expect(milestoneReached!.milestone).toBe(7);
      expect(milestoneReached!.reached).toBe(true);
    });

    it('should detect milestone at 14 days', () => {
      const yesterday = makeDate('2026-06-13');
      const today = makeDate('2026-06-14');
      const s = createStreak({
        currentStreak: 13,
        longestStreak: 13,
        lastCompletedDate: yesterday,
      });

      const { milestoneReached } = s.recordCompletion(today);

      expect(milestoneReached).not.toBeNull();
      expect(milestoneReached!.milestone).toBe(14);
    });

    it('should detect milestone at 30 days', () => {
      const today = makeDate('2026-06-30');
      const yesterday = makeDate('2026-06-29');
      const s = createStreak({
        currentStreak: 29,
        longestStreak: 29,
        lastCompletedDate: yesterday,
      });

      const { milestoneReached } = s.recordCompletion(today);

      expect(milestoneReached).not.toBeNull();
      expect(milestoneReached!.milestone).toBe(30);
    });

    it('should detect milestone at 60 days', () => {
      const today = makeDate('2026-06-30');
      const yesterday = makeDate('2026-06-29');
      const s = createStreak({
        currentStreak: 59,
        longestStreak: 59,
        lastCompletedDate: yesterday,
      });

      const { milestoneReached } = s.recordCompletion(today);

      expect(milestoneReached).not.toBeNull();
      expect(milestoneReached!.milestone).toBe(60);
    });

    it('should detect milestone at 90 days', () => {
      const today = makeDate('2026-06-30');
      const yesterday = makeDate('2026-06-29');
      const s = createStreak({
        currentStreak: 89,
        longestStreak: 89,
        lastCompletedDate: yesterday,
      });

      const { milestoneReached } = s.recordCompletion(today);

      expect(milestoneReached).not.toBeNull();
      expect(milestoneReached!.milestone).toBe(90);
    });

    it('should not detect milestone for non-milestone counts', () => {
      const yesterday = makeDate('2026-06-02');
      const today = makeDate('2026-06-03');
      const s = createStreak({
        currentStreak: 2,
        longestStreak: 2,
        lastCompletedDate: yesterday,
      });

      const { milestoneReached } = s.recordCompletion(today);

      expect(milestoneReached).toBeNull();
    });

    it('should not detect milestone on first completion (count=1)', () => {
      const s = createStreak();
      const { milestoneReached } = s.recordCompletion(makeDate('2026-06-01'));

      expect(milestoneReached).toBeNull();
    });

    it('should handle reset followed by rebuilding streak', () => {
      const oldDate = makeDate('2026-05-20');
      const today = makeDate('2026-06-03');
      const s = createStreak({
        currentStreak: 10,
        longestStreak: 15,
        lastCompletedDate: oldDate,
      });

      const { streak: afterReset } = s.recordCompletion(today);
      expect(afterReset.currentStreak).toBe(1);

      const nextDay = makeDate('2026-06-04');
      const { streak: afterConsecutive } = afterReset.recordCompletion(nextDay);
      expect(afterConsecutive.currentStreak).toBe(2);
      expect(afterConsecutive.longestStreak).toBe(15);
    });

    it('should not use grace day for gap of 1', () => {
      const yesterday = makeDate('2026-06-01');
      const today = makeDate('2026-06-02');
      const s = createStreak({
        currentStreak: 5,
        longestStreak: 5,
        lastCompletedDate: yesterday,
        graceDayUsed: true,
      });

      const { streak } = s.recordCompletion(today);

      expect(streak.currentStreak).toBe(6);
      expect(streak.graceDayUsed).toBe(true);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same date', () => {
      const s = createStreak();
      expect(s.isSameDay(makeDate('2026-06-01'), makeDate('2026-06-01'))).toBe(true);
    });

    it('should return false for different dates', () => {
      const s = createStreak();
      expect(s.isSameDay(makeDate('2026-06-01'), makeDate('2026-06-02'))).toBe(false);
    });

    it('should return false when either date is null', () => {
      const s = createStreak();
      expect(s.isSameDay(null, makeDate('2026-06-01'))).toBe(false);
      expect(s.isSameDay(makeDate('2026-06-01'), null)).toBe(false);
    });
  });

  describe('daysBetween', () => {
    it('should return 1 for consecutive days', () => {
      const s = createStreak();
      expect(s.daysBetween(makeDate('2026-06-01'), makeDate('2026-06-02'))).toBe(1);
    });

    it('should return 2 for a one-day gap', () => {
      const s = createStreak();
      expect(s.daysBetween(makeDate('2026-06-01'), makeDate('2026-06-03'))).toBe(2);
    });
  });

  describe('checkMilestone', () => {
    it('should return milestone for 7', () => {
      const s = createStreak();
      const result = s.checkMilestone(7);
      expect(result).not.toBeNull();
      expect(result!.milestone).toBe(7);
    });

    it('should return null for non-milestone', () => {
      const s = createStreak();
      expect(s.checkMilestone(8)).toBeNull();
    });
  });
});
