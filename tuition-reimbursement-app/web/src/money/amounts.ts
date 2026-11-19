/**
 * Amounts of money, as the contract means them.
 *
 * An amount is an exact decimal with two places, carried as a string so that it
 * never passes through a binary float: an Approved Amount and a Reimbursed Amount
 * have to be exact to the cent.
 */

/**
 * What an amount an Applicant types has to look like, for the browser's own
 * validation to judge it before anything is sent.
 *
 * This mirrors one line of `contract/openapi.yaml`: the `pattern` on the `Amount`
 * schema, `"^[0-9]+\\.[0-9]{2}$"`. The contract is the source of truth (ADR 0004)
 * and the generated client is how that truth normally reaches the browser, but
 * `openapi-typescript` carries only the type and not the constraint, so `Amount`
 * arrives in `api/generated/schema.d.ts` as a bare `string`. Until the generator
 * carries the pattern too, this is the single place in the frontend that repeats
 * it: change the contract and change this line, and no other.
 *
 * The anchors are left off on purpose. An `<input pattern>` is matched against the
 * whole value already, and `^`/`$` inside one are an error.
 */
export const AMOUNT_PATTERN = "[0-9]+\\.[0-9]{2}";
