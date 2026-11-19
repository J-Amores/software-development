import { useEffect, useRef, useState } from "react";
import { signIn, SignInRejected } from "../auth/cognito";
import { config } from "../config";
import { syncUserInvalidWithAria } from "../forms/userInvalid";

/**
 * Sign in with the Employer account. The browser validates the fields and offers
 * the saved password; this component only handles what Cognito says.
 */
export function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const form = useRef<HTMLFormElement>(null);
  const [rejection, setRejection] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => (form.current ? syncUserInvalidWithAria(form.current) : undefined), []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entered = new FormData(event.currentTarget);
    setRejection(null);
    setSigningIn(true);
    try {
      await signIn(String(entered.get("email")), String(entered.get("password")));
      onSignedIn();
    } catch (refused) {
      setRejection(
        refused instanceof SignInRejected
          ? refused.message
          : "Sign-in could not be reached. Try again in a moment.",
      );
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="panel">
      <h1>Tuition Reimbursement</h1>
      <p className="lede">Sign in with your {config.employerName} account.</p>

      <form ref={form} onSubmit={submit} className="stack">
        <div className="field">
          <label htmlFor="email">Work email</label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="username"
            spellCheck={false}
            required
            data-error="email-error"
          />
          <span id="email-error" className="error-msg">
            Enter the email address your Employer account uses.
          </span>
        </div>

        <div className="field">
          <label htmlFor="current-password">Password</label>
          <input
            type="password"
            id="current-password"
            name="password"
            autoComplete="current-password"
            enterKeyHint="done"
            required
            data-error="password-error"
          />
          <span id="password-error" className="error-msg">
            Enter your password.
          </span>
        </div>

        <button type="submit" disabled={signingIn}>
          {signingIn ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Cognito's answer is not a field problem, so it is announced on its own. */}
      <p role="status" aria-live="polite" className={rejection ? "rejection" : "visually-hidden"}>
        {rejection}
      </p>
    </main>
  );
}
