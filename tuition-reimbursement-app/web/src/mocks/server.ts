import { setupServer } from "msw/node";
import { handlers } from "./generated/handlers";

/**
 * The mock API for the frontend's tests. It answers with the same generated
 * handlers that power demo mode in the browser (`mocks/browser.ts`), so a test
 * that passes here also says demo mode works (Testing Decisions, seam 3).
 */
export const mockApi = setupServer(...handlers);
