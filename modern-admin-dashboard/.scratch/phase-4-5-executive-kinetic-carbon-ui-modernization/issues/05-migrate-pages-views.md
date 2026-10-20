# 05: Batch Migrate Pages Views (/form, /calendar, /faq)

**What to build:** Modernize the Pages views (`/form`, `/calendar`, `/faq`) to the Executive Kinetic Carbon design system. Update the profile form with inset `#09090b` inputs and glowing focus borders. Update the calendar with dark carbon grid cells, specular event chips, and `@starting-style` transitions on event creation dialogs. Update the curated FAQ accordion with obsidian panels and glowing active focus states. Verify all view unit tests pass cleanly.

**Blocked by:** 01: Expand Executive Kinetic Carbon Tokens, Typography Fonts, and App Shell Layout.

**Status:** ready-for-agent

- [ ] Modernize `FormView` (`/form`) with `.bento-card` framing, inset form inputs (`background: #09090b`, border `1px solid rgba(255, 255, 255, 0.1)`), and electric indigo focus rings (`box-shadow: 0 0 0 1px #6366f1`)
- [ ] Modernize `CalendarComponent` (`/calendar`) and `web/src/styles/calendar.css` with dark carbon surfaces, specular event chips, and native CSS `@starting-style` transitions on event creation `<dialog>` modals
- [ ] Modernize `FaqView` (`/faq`) and `web/src/styles/faq.css` with obsidian accordion panels, smooth expand/collapse transitions, and search query highlights
- [ ] Apply `staggerEnter` on form card, calendar container, and FAQ accordion items on mount
- [ ] Verify `web/test/form-view.test.js`, `web/test/calendar-view.test.js`, `web/test/calendar-component.test.js`, and `web/test/faq-view.test.js` pass with zero regressions
