# SCORE Opportunity Index

Post-MVP reference.

Normalize components to 0–100.

```text
base =
  velocity * 0.20
+ acceleration * 0.15
+ diffusion * 0.10
+ novelty * 0.15
+ structural_reusability * 0.15
+ brand_proximity * 0.15
+ evidence_confidence * 0.10

final = clamp(base - saturation_penalty + arbitrage_bonus, 0, 100)
```

- saturation penalty: 0–20
- arbitrage bonus: 0–10

Action label:
- 0–39 IGNORE
- 40–59 WATCH
- 60–74 TEST
- 75–89 PRIORITY
- 90–100 BREAKOUT

This is an opportunity heuristic, not a guarantee of performance.
Thin evidence must reduce confidence.
