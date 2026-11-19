import type { components } from "../api/generated/schema";

type ApplicationStatus = components["schemas"]["ApplicationStatus"];

const WORDS: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
};

/**
 * A status as the Program names it (GLOSSARY.md). The contract spells statuses in
 * lower case on the wire; an Applicant only ever reads the Program's own word.
 */
export function statusWord(status: ApplicationStatus): string {
  return WORDS[status];
}
