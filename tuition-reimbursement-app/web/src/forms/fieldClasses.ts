/**
 * The classes every form on every screen marks a required field and its error
 * message with, so a field at fault looks the same wherever the Applicant meets
 * one.
 *
 * Tailwind only builds the classes it can read literally in the source, so a
 * shared string of classes is a constant and never anything assembled at runtime
 * (ADR 0010).
 */

/**
 * A field the screen needs. `peer` is what its error message reads to know
 * whether the browser has decided the field is wrong yet, and the field marks
 * itself at the same moment (accessible-error-announcement). Both halves belong
 * together: `peer` alone shows the message under a field that still looks fine.
 */
export const REQUIRED_FIELD = "peer user-invalid:border-destructive";

/** Every field's error message, shown by the browser's own `:user-invalid` state. */
export const ERROR_MESSAGE = "hidden text-sm text-destructive peer-user-invalid:block";
