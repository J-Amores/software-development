import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Starts the mock in the browser. The same handlers power demo mode and the
 * frontend's tests, so a test that passes proves demo mode works (Testing
 * Decisions, seam 3).
 */
export async function startMockApi(): Promise<void> {
  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledFrame: "bypass", quiet: true });
}
