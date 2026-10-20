# 02: Implement Deep Motion Utility Module and Cross-Route View Transitions

**What to build:** Create the deep motion utility module (`web/src/styles/motion.css` and `web/src/utils/motion.js`) providing zero-dependency Web Standards animation helpers (`transitionView`, `staggerEnter`, `animateNumber`, `bindBentoSpotlight`). Implement the deterministic test and accessibility guardrail (`isMotionReduced()`) ensuring all animations resolve synchronously on frame 0 in Vitest and accessibility modes. Integrate `transitionView` into `web/src/router/index.js` with `view-transition-name` rules for `app-sidebar`, `app-topbar`, and `view-canvas`, while keeping router unit tests synchronous and deterministic.

**Blocked by:** 01: Expand Executive Kinetic Carbon Tokens, Typography Fonts, and App Shell Layout.

**Status:** ready-for-agent

- [ ] Create `web/src/styles/motion.css` defining keyframes for `staggerIn`, `spotlightGlow`, and `view-transition-name` declarations for pinned shell elements (`app-sidebar`, `app-topbar`, `#view-container`)
- [ ] Create `web/src/utils/motion.js` exporting `isMotionReduced()`, `transitionView(callback)`, `staggerEnter(container, selector)`, `animateNumber(el, targetValue, formatter)`, and `bindBentoSpotlight(container)`
- [ ] Implement synchronous frame 0 resolution in `isMotionReduced()` when `prefers-reduced-motion: reduce`, `import.meta.env.MODE === 'test'`, or missing animation APIs
- [ ] Integrate `transitionView` into `web/src/router/index.js` view swap lifecycle, resetting `#view-container.scrollTop = 0` on navigation
- [ ] Implement `staggerEnter` clamping the stagger index at 8 items (`Math.min(index, 8) * 35ms`, max 280ms duration)
- [ ] Implement `bindBentoSpotlight` throttled via `requestAnimationFrame` setting `--mouse-x` and `--mouse-y` strictly on `e.target.closest('.bento-card')`, returning an unbind teardown function
- [ ] Add `web/test/motion.test.js` validating that `isMotionReduced()` returns true in test mode and helpers execute synchronously without throwing
- [ ] Verify `web/test/router.test.js` and `vp check` pass cleanly
