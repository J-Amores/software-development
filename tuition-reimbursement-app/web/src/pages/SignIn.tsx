import { useEffect, useRef, useState } from "react";
import { signIn, SignInRejected } from "../auth/cognito";
import { config } from "../config";
import { syncUserInvalidWithAria } from "../forms/userInvalid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <h1>Tuition Reimbursement</h1>
          </CardTitle>
          <CardDescription>Sign in with your {config.employerName} account.</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <form ref={form} onSubmit={submit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Work email</FieldLabel>
                {/* `peer` is what the error message below reads to know whether the
                    browser has decided this field is wrong yet
                    (accessible-error-announcement). */}
                <Input
                  className="peer"
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="username"
                  spellCheck={false}
                  required
                  data-error="email-error"
                />
                <span
                  id="email-error"
                  className="hidden text-sm text-destructive peer-user-invalid:block"
                >
                  Enter the email address your Employer account uses.
                </span>
              </Field>

              <Field>
                <FieldLabel htmlFor="current-password">Password</FieldLabel>
                <Input
                  className="peer"
                  type="password"
                  id="current-password"
                  name="password"
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  data-error="password-error"
                />
                <span
                  id="password-error"
                  className="hidden text-sm text-destructive peer-user-invalid:block"
                >
                  Enter your password.
                </span>
              </Field>

              <Button type="submit" disabled={signingIn}>
                {signingIn ? "Signing in…" : "Sign in"}
              </Button>
            </FieldGroup>
          </form>

          {/* Cognito's answer is not a field problem, so it is announced on its own. */}
          <p
            role="status"
            aria-live="polite"
            className={rejection ? "text-sm text-destructive" : "sr-only"}
          >
            {rejection}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
