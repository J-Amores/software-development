import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { components } from "../api/generated/schema";

type Me = components["schemas"]["Me"];

/**
 * The walking skeleton's home page: it asks the backend who is signed in, through
 * the generated client, and shows what comes back. The round-trip test reads this
 * page (ADR 0008).
 */
export function Home({ onSignOut }: { onSignOut: () => void }) {
  const [person, setPerson] = useState<Me | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    api.GET("/me").then(({ data, error, response }) => {
      if (!current) return;
      if (data) {
        setPerson(data);
      } else if (response.status === 401) {
        onSignOut();
      } else {
        setProblem(`The API answered ${response.status}.${error ? ` ${String(error)}` : ""}`);
      }
    });
    return () => {
      current = false;
    };
  }, [onSignOut]);

  return (
    <main className="panel">
      <h1>Tuition Reimbursement</h1>
      <p role="status" aria-live="polite">
        {person ? (
          <>
            Signed in as <strong data-testid="signed-in-as">{person.name}</strong> ({person.email})
          </>
        ) : problem ? (
          problem
        ) : (
          "Reading your identity…"
        )}
      </p>
      <button type="button" onClick={onSignOut}>
        Sign out
      </button>
    </main>
  );
}
