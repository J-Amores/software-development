import type { VariantProps } from "class-variance-authority";
import type { components } from "../api/generated/schema";
import type { badgeVariants } from "@/components/ui/badge";

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

/**
 * How loudly a status is shown: the Badge variant every screen that shows one
 * uses. A Draft is still the Applicant's own and nothing has happened to it, so
 * it is the quiet badge; every other status is something the Program has acted
 * on, and reads as the Application's current standing.
 *
 * The type comes from the Badge itself, so a variant renamed in the registry's
 * component stops this compiling rather than silently styling nothing.
 */
export function statusTone(
  status: ApplicationStatus,
): VariantProps<typeof badgeVariants>["variant"] {
  return status === "draft" ? "secondary" : "default";
}
