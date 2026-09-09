// Shared tuning constant for damped scroll-linked motion. Both the scroll
// vessel and the divisions sequence ease a `current` value toward a
// scroll-derived `target` with `current += (target - current) * DAMPING`
// — declared once here so the two independent <script> blocks that use it
// (in index.astro) can't drift out of sync with each other.
export const DAMPING = 0.35;
