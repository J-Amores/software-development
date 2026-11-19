import { Temporal as polyfilled } from "temporal-polyfill";

/**
 * Calendar dates and instants, as the Program means them.
 *
 * A Course's start and end dates are calendar dates, not instants: 15 March 2027
 * is the same day wherever the Applicant reads it from. `Date` cannot hold one —
 * it is always a moment in time, so a date read back west of UTC slides to the day
 * before — so these use Temporal's `PlainDate`, with the polyfill where the
 * browser has no Temporal of its own yet.
 */
const Temporal = (globalThis as { Temporal?: typeof polyfilled }).Temporal ?? polyfilled;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Today, as a calendar date, from the browser's own clock. */
export function today(): string {
  return Temporal.Now.plainDateISO().toString();
}

/** Whether a calendar date is today or already past. */
export function hasArrived(date: string): boolean {
  return Temporal.PlainDate.compare(date, today()) <= 0;
}

/** The day after today, which is the earliest a Course may start to be submitted. */
export function tomorrow(): string {
  return Temporal.Now.plainDateISO().add({ days: 1 }).toString();
}

/** A calendar date as the Applicant reads it: "15 March 2027". */
export function readableDate(date: string): string {
  const day = Temporal.PlainDate.from(date);
  return `${day.day} ${MONTHS[day.month - 1] ?? day.month} ${day.year}`;
}

/**
 * An instant as the Applicant reads it: "4 November 2026 at 16:40 UTC". It is
 * shown in UTC and says so, because the Employer's own time zone is the backend's
 * configuration and does not reach the browser.
 */
export function readableInstant(instant: string): string {
  const moment = Temporal.Instant.from(instant).toZonedDateTimeISO("UTC");
  const hour = String(moment.hour).padStart(2, "0");
  const minute = String(moment.minute).padStart(2, "0");
  return `${readableDate(moment.toPlainDate().toString())} at ${hour}:${minute} UTC`;
}
