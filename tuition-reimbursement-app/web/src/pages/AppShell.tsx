import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router";
import { Toaster } from "sonner";
import { api } from "../api/client";
import type { components } from "../api/generated/schema";
import { config } from "../config";

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
    <div className="app">
      <header className="masthead">
        <p className="brand">{config.employerName} Tuition Reimbursement</p>
        <nav aria-label="Main">
          <Link to="/">My Applications</Link>
        </nav>
        <p className="who" role="status" aria-live="polite">
          {person ? (
            <>
              Signed in as <strong data-testid="signed-in-as">{person.name}</strong> ({person.email})
            </>
          ) : (
            (problem ?? "Reading your identity…")
          )}
        </p>
        <button type="button" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      <main>
        <Outlet />
      </main>

      {/* One place every notification appears, so it is always found in the same
          spot (persistent-toast-notifications). */}
      <Toaster position="top-center" closeButton richColors />
    </div>
  );
}
