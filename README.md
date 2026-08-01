# Software Development

**John Amores** · Software engineer working in cloud platforms, data analytics and enterprise
telecom systems.

Application work. This repository is the home for full-stack builds; each one lands as its own
directory with its source, its tests and its own README.

**Nothing is shipped here yet.** What follows is what is in hand and what is coming, stated
honestly rather than padded — the first build is in specification and has not been written.

---

## In flight

### Finance Dashboard (PERN)

A finance dashboard for the owner of a small direct-to-consumer store, answering which months and
which products actually made money. The constraint that shapes the whole build: **every figure is
derived at read time from the transactions and expenses beneath it**, never read back from a stored
total, and a reader must be able to see the SQL that produced any number *and how it executes*.

That last part is the product rather than a garnish. The bulk of the build is an interactive query
surface where each analytics question is a named view carrying its SQL, its result, and its
`EXPLAIN ANALYZE` plan. A feature that hides its derivation fails the brief even when it returns
the right answer.

**Stack** — versions pinned, resolved from the registry rather than from memory:

| Layer | Choice |
|---|---|
| Frontend | React 19 · Vite 8 · TypeScript 5.9 |
| Styling | Tailwind CSS 4 (CSS-first config) · shadcn/ui |
| Charts | Recharts 3 |
| State / fetching | Redux Toolkit + RTK Query 2 |
| Backend | Node 20 · Express 5 · REST + JSON |
| Database | Neon serverless Postgres (PG 17) |
| Query layer | Drizzle ORM |
| Validation | Zod, schemas shared across the wire |
| Tests | Vitest, both sides · Supertest · Testing Library |

Three deliberate departures from the reference implementation it started from: **Postgres and SQL
replace MongoDB**, which is the point of the project rather than an implementation detail;
**Tailwind and shadcn/ui replace MUI**; and **Drizzle over Prisma specifically because Drizzle
keeps the SQL visible in the diff.**

**Status —** specification, paused at the spec gate. 8 pages and 13 modules mapped, decomposed into
11 phases and 24 work items. The gate is held open on purpose: the confirmed scope and the
confirmed data baseline contradict each other, and specifying work against a baseline that cannot
support it would be specifying work that cannot be built. That gets ruled on before any code is
written.

## How these get built

Every project here runs through the same gated pipeline, and the gates are the interesting part:

- **Spec** — pages, modules, phases and work items, decomposed before anything is written. The
  spec is not confirmed by whoever wrote it.
- **Prototype** — HTML first, reviewed against the spec, approved before any framework code.
- **Build** — test-first, with the failing test observed and recorded before the code that passes
  it. Once both are green, a test written first and a test written after look identical, so the
  observation is the only evidence that survives.
- **Review** — five independent lenses, then a fix, then a **fresh** re-review. No reviewer
  verifies a fix to something it filed itself.
- **Ship** — a verification pass that reads only the built artifact and tries to refute every
  claim made about it. A standing refutation means not done.

The through-line: **no stage verifies its own work.** Most of what makes a build trustworthy is
structural, not diligence.

## Coming here

Five applications built earlier, to be prepared and added: a library management admin app, a web
traffic and engagement dashboard, a space tourism site, a studio site, and a real estate rental
app. They are being reworked to the standard above before they land, rather than dropped in as-is.

## Elsewhere

Data analysis case studies live in a separate repository —
[**data-analyst-portfolio**](https://github.com/J-Amores/data-analyst-portfolio).

## Contact

- **LinkedIn** — [linkedin.com/in/john-amores](https://linkedin.com/in/john-amores)
- **Email** — johncamores@gmail.com
