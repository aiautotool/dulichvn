import type { HelperReputation } from '../types';

export class HelperReputationService {
  calculate(input: Omit<HelperReputation, 'reputationScore' | 'level' | 'updatedAt'>, now = Date.now()): HelperReputation {
    const completionRate = input.totalJobs > 0 ? input.completedJobs / input.totalJobs : 0;
    const disputePenalty = input.disputedJobs * 8 + input.cancelledJobs * 2;
    const contributionScore = input.validStatusReports * 0.8 + input.verifiedPhotos * 1.2;
    const responseBonus = input.averageResponseTimeSeconds > 0 ? Math.max(0, 10 - input.averageResponseTimeSeconds / 30) : 0;
    const reputationScore = Math.max(0, Math.min(100, Math.round(completionRate * 60 + contributionScore + responseBonus - disputePenalty)));
    return { ...input, reputationScore, level: this.levelFor(reputationScore), updatedAt: now };
  }

  private levelFor(score: number): HelperReputation['level'] {
    if (score >= 80) return 'expert';
    if (score >= 55) return 'trusted';
    if (score >= 25) return 'local';
    return 'new';
  }
}
