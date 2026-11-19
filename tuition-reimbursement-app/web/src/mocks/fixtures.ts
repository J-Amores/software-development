import type { components } from "../api/generated/schema";

/**
 * What the in-browser mock answers with, one function per operation in the
 * contract. The handlers that call them are generated
 * (`mocks/generated/handlers.ts`), so an operation added to the contract fails to
 * typecheck here until its fixture exists.
 *
 * Fixed data for now. The Faker cast of People and Applications, and the domain
 * rules the Demo Scenarios lean on, arrive with ticket 16.
 */
export const getHealth = (): components["schemas"]["Health"] => ({
  status: "up",
  postgres: { reachable: true },
  s3: { reachable: true },
  time: new Date().toISOString(),
});

export const getMe = (): components["schemas"]["Me"] => ({
  personId: "00000000-0000-4000-8000-000000000001",
  name: "Ada Lovelace",
  email: "ada@darkowl.test",
});
