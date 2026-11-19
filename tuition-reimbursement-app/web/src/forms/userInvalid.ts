/**
 * Keeps `aria-invalid` in step with the browser's own `:user-invalid` state, so a
 * screen reader hears about a problem at the same moment it becomes visible, and
 * not the instant someone tabs into an empty required field.
 *
 * A field's error message is named by its `data-error` attribute and is referenced
 * from `aria-describedby` only while it is shown: text that `aria-describedby`
 * points at is announced even when it is hidden.
 */
const DESCRIBED_BY = "aria-describedby";

export function syncUserInvalidWithAria(form: HTMLFormElement): () => void {
  const fields = () => form.querySelectorAll<HTMLInputElement>("input, select, textarea");

  const linkError = (field: HTMLElement, shown: boolean) => {
    const errorId = field.dataset.error;
    if (!errorId) return;
    const ids = (field.getAttribute(DESCRIBED_BY) ?? "")
      .split(/\s+/)
      .filter((id) => id && id !== errorId);
    if (shown) ids.push(errorId);
    if (ids.length > 0) field.setAttribute(DESCRIBED_BY, ids.join(" "));
    else field.removeAttribute(DESCRIBED_BY);
  };

  // `:user-invalid` is the browser's own record of whether the Person has had a go
  // at a field yet, and there is no other way to read it. A DOM that does not know
  // the selector throws rather than answering, and the frontend's tests run in one
  // of those, so a field there is simply never reported as invalid: what the
  // Applicant is told about a refused Application is the form's own doing, not this.
  const userInvalid = (field: HTMLElement): boolean => {
    try {
      return field.matches(":user-invalid");
    } catch {
      return false;
    }
  };

  const sync = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement) || !target.matches("input, select, textarea")) return;
    const invalid = userInvalid(target);
    target.setAttribute("aria-invalid", invalid ? "true" : "false");
    linkError(target, invalid);
  };

  // Firefox and Safari expose an empty required field as invalid from page load, so
  // every field starts at aria-invalid="false" rather than with the attribute unset.
  fields().forEach((field) => sync(field));

  const onBlur = (event: Event) => sync(event.target);
  const onInput = (event: Event) => sync(event.target);
  // `invalid` does not bubble, so it is listened for in the capture phase.
  const onInvalid = (event: Event) => sync(event.target);

  form.addEventListener("blur", onBlur, true);
  form.addEventListener("input", onInput);
  form.addEventListener("invalid", onInvalid, true);
  return () => {
    form.removeEventListener("blur", onBlur, true);
    form.removeEventListener("input", onInput);
    form.removeEventListener("invalid", onInvalid, true);
  };
}
