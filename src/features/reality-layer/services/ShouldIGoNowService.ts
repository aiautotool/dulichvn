import type { TravelDecision, TravelDecisionContext } from '../types';

export class ShouldIGoNowService {
  decide(context: TravelDecisionContext): TravelDecision {
    const sampleSize = context.realityScore?.sampleSize ?? 0;
    if (sampleSize < 2 && !context.realityStatus) {
      return {
        verdict: 'insufficient_data',
        title: "We don't have enough recent local data.",
        reasons: ['Request a current photo or ask a local before going.'],
        recommendation: 'Use Request Current Photo for a quick reality check.',
        confidence: 0.25,
      };
    }

    const reasons: string[] = [];
    let risk = 0;
    const status = context.realityStatus;
    if (status?.closed) {
      risk += 5;
      reasons.push('The place may be closed right now.');
    }
    if (status?.restricted) {
      risk += 4;
      reasons.push('Local reports mention access restriction.');
    }
    if (status?.crowdLevel === 'very_crowded') {
      risk += 3;
      reasons.push('Very crowded according to recent local status.');
    } else if (status?.crowdLevel === 'crowded') {
      risk += 1.5;
      reasons.push('Crowded right now.');
    }
    if ((status?.temperature ?? 0) >= 34) {
      risk += 1;
      reasons.push(`${status?.temperature}°C may feel uncomfortable.`);
    }
    if (context.recentScamReports.length >= 3) {
      risk += 2;
      reasons.push('Several recent tourist problem reports nearby.');
    }
    if ((context.realityScore?.overallScore ?? 10) < 6) {
      risk += 2;
      reasons.push('Reality Score is currently low.');
    }
    if (reasons.length === 0) reasons.push('Recent local signals look acceptable.');

    if (risk >= 6) {
      return { verdict: 'avoid', title: `Avoid ${context.destination.name} right now.`, reasons, recommendation: 'Check another nearby destination or request live photos.', confidence: 0.82 };
    }
    if (risk >= 3) {
      return { verdict: 'wait', title: `Wait before going to ${context.destination.name}.`, reasons, recommendation: 'Try later today or ask a local for confirmation.', confidence: 0.72 };
    }
    return { verdict: 'go_now', title: `${context.destination.name} looks good to visit now.`, reasons, recommendation: 'Go now, but keep checking local alerts.', confidence: 0.78 };
  }
}
