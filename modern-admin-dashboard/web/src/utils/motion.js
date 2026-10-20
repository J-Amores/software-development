/**
 * Motion Utility Module
 * Zero-dependency Web Standards animation helpers for Tactile Fluidity.
 * Enforces deterministic synchronous execution under test runners and reduced-motion modes.
 */

/**
 * Checks whether motion should be bypassed.
 * Returns true if prefers-reduced-motion is active, running under Vitest, or in headless DOM.
 *
 * @returns {boolean}
 */
export function isMotionReduced() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return true;
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.MODE === "test") {
    return true;
  }
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return true;
  }
  return false;
}

/**
 * Wraps a view swap in document.startViewTransition if supported and motion is allowed.
 * Executes synchronously on frame 0 otherwise.
 *
 * @param {() => void | Promise<void>} callback
 * @returns {void | Promise<void>}
 */
export function transitionView(callback) {
  if (
    !isMotionReduced() &&
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function"
  ) {
    return document.startViewTransition(callback);
  }
  return callback();
}

/**
 * Staggers matching child elements into view with clamped delay ceiling.
 *
 * @param {HTMLElement} container
 * @param {string} [selector='.stagger-item']
 * @param {number} [maxItems=8]
 */
export function staggerEnter(container, selector = ".stagger-item", maxItems = 8) {
  if (!container || isMotionReduced()) {
    return;
  }

  const items = container.querySelectorAll(selector);
  items.forEach((item, index) => {
    const clampedIndex = Math.min(index, maxItems);
    item.style.setProperty("--stagger-index", String(clampedIndex));
  });
}

/**
 * Animates a numeric element from 0 to target value with tabular numbers.
 * Resolves synchronously in test and reduced motion environments.
 *
 * @param {HTMLElement} el
 * @param {number} targetValue
 * @param {(val: number) => string} [formatter]
 * @param {number} [duration=400]
 */
export function animateNumber(
  el,
  targetValue,
  formatter = (v) => String(Math.round(v)),
  duration = 400,
) {
  if (!el) return;

  const target = Number(targetValue) || 0;

  if (isMotionReduced()) {
    el.textContent = formatter(target);
    el.dataset.rawValue = String(target);
    return;
  }

  const startTime = performance.now();
  const startValue = 0;

  function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  function frame(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutExpo(progress);
    const currentVal = startValue + (target - startValue) * easedProgress;

    el.textContent = formatter(currentVal);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = formatter(target);
      el.dataset.rawValue = String(target);
    }
  }

  requestAnimationFrame(frame);
}

/**
 * Binds a delegated pointermove listener to update specular spotlight coordinates on .bento-card tiles.
 * Throttled using requestAnimationFrame. Returns an unbind teardown function.
 *
 * @param {HTMLElement} container
 * @returns {() => void}
 */
export function bindBentoSpotlight(container) {
  if (!container || isMotionReduced()) {
    return () => {};
  }

  let rafId = null;
  let activeCard = null;
  let pendingX = 0;
  let pendingY = 0;

  function onPointerMove(e) {
    const card = e.target.closest?.(".bento-card");
    if (!card) {
      if (activeCard) {
        activeCard.style.removeProperty("--mouse-x");
        activeCard.style.removeProperty("--mouse-y");
        activeCard = null;
      }
      return;
    }

    const rect = card.getBoundingClientRect();
    pendingX = e.clientX - rect.left;
    pendingY = e.clientY - rect.top;
    activeCard = card;

    if (!rafId) {
      rafId = requestAnimationFrame(() => {
        if (activeCard) {
          activeCard.style.setProperty("--mouse-x", `${pendingX}px`);
          activeCard.style.setProperty("--mouse-y", `${pendingY}px`);
        }
        rafId = null;
      });
    }
  }

  function onPointerLeave() {
    if (activeCard) {
      activeCard.style.removeProperty("--mouse-x");
      activeCard.style.removeProperty("--mouse-y");
      activeCard = null;
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  container.addEventListener("pointermove", onPointerMove, { passive: true });
  container.addEventListener("pointerleave", onPointerLeave, { passive: true });

  return function unbind() {
    container.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("pointerleave", onPointerLeave);
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    activeCard = null;
  };
}
