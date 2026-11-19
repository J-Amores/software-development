import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router";
import { Toaster } from "sonner";
import { api } from "../api/client";
import type { components } from "../api/generated/schema";
import { config } from "../config";
import { Button, buttonVariants } from "@/components/ui/button";

type Me = components["schemas"]["Me"];

/**
 * What every screen a signed-in Person sees has around it: who they are, the way
 * back to their own Applications, and the one place notifications appear.
 *
 * It asks the backend who is signed in, through the generated client, which is
 * also what the round-trip test reads (ADR 0008).
 */
export function AppShell({ onSignOut }: { onSignOut: () => void }) {
  const [person, setPerson] = useState<Me | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    api.GET("/me").then(({ data, error, response }) => {
      if (!current) return;
      if (data) setPerson(data);
      else if (response.status === 401) onSignOut();
      else setProblem(`The API answered ${response.status}.${error ? ` ${String(error)}` : ""}`);
    });
    return () => {
      current = false;
    };
  }, [onSignOut]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b pb-4">
        <p className="font-heading font-medium">{config.employerName} Tuition Reimbursement</p>
        <nav aria-label="Main">
          {/* A link that looks like a button stays a link: the registry's own
              variants style it, rather than a Button rendering an anchor and
              taking the button role with it. */}
          <Link to="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            My Applications
          </Link>
        </nav>
        <p className="ms-auto text-sm text-muted-foreground" role="status" aria-live="polite">
          {person ? (
            <>
              Signed in as <strong data-testid="signed-in-as">{person.name}</strong> ({person.email})
            </>
          ) : (
            (problem ?? "Reading your identity…")
          )}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onSignOut}>
          Sign out
        </Button>
      </header>

      <main className="flex w-full flex-col items-start gap-4">
        <Outlet />
      </main>

      {/* One place every notification appears, so it is always found in the same
          spot (persistent-toast-notifications). */}
      <Toaster position="top-center" closeButton richColors />
    </div>
  );
}
