# Reality Score

Reality Score is not a star rating. It measures whether the place is good to visit right now.

Inputs:

- Verified current photos
- Place status submissions
- Scam reports
- Price reports
- Data freshness
- Local confidence

Recent signals receive more weight using exponential time decay.

The algorithm lives in `RealityScoreService` so UI components do not contain scoring logic.
