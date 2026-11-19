import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { vi } from "vitest";
import { App } from "../App";
import { rememberIdentityToken } from "../auth/session";

/** The day every test reads as today, so that no test rots as the real date moves. */
export const TODAY = "2026-11-18";

/**
 * Freeze the clock the screens read, leaving timers real so that Testing Library
 * and the mock still run on their own.
 */
export function freezeClock(): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
}

/**
 * The app as a signed-in Applicant finds it when they open `at`, and the user who
 * acts on it. Sign-in is Cognito's own call rather than part of the contract, so
 * the identity token is put where a successful sign-in would have left it.
 */
export function openApp(at: string): ReturnType<typeof userEvent.setup> {
  rememberIdentityToken("test-identity-token");
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[at]}>
      <App />
    </MemoryRouter>,
  );
  return user;
}
