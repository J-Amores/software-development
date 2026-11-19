import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { api } from "../api/client";
import type { components } from "../api/generated/schema";
import { syncUserInvalidWithAria } from "../forms/userInvalid";
import { hasArrived, readableDate, tomorrow } from "../time/plainDates";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type ApplicationDraft = components["schemas"]["ApplicationDraft"];

/**
 * What the Applicant has typed. Every one is a string, including the amounts: an
 * amount is an exact decimal with two places and never becomes a binary float, in
 * the browser any more than in the backend (contract, `Amount`).
 */
interface Entered {
  institution: string;
  title: string;
  startDate: string;
  endDate: string;
  cost: string;
  degreeProgram: string;
  eligibleCost: string;
}

const NOTHING_ENTERED: Entered = {
  institution: "",
  title: "",
  startDate: "",
  endDate: "",
  cost: "",
  degreeProgram: "",
  eligibleCost: "",
};

/** What the Program needs before an Application can be submitted, in reading order. */
const REQUIRED: ReadonlyArray<{ field: keyof Entered; message: string }> = [
  { field: "institution", message: "Institution is required." },
  { field: "title", message: "Course title is required." },
  { field: "startDate", message: "Start date is required." },
  { field: "endDate", message: "End date is required." },
  { field: "cost", message: "Course cost is required." },
  { field: "eligibleCost", message: "Eligible Cost is required." },
];

const AMOUNT = "[0-9]+\\.[0-9]{2}";

/** Every field's error message, shown by the browser's own `:user-invalid` state. */
const ERROR_MESSAGE = "hidden text-sm text-destructive peer-user-invalid:block";

const asDraft = (entered: Entered): ApplicationDraft => ({
  course: {
    ...(entered.institution ? { institution: entered.institution } : {}),
    ...(entered.title ? { title: entered.title } : {}),
    ...(entered.startDate ? { startDate: entered.startDate } : {}),
    ...(entered.endDate ? { endDate: entered.endDate } : {}),
    ...(entered.cost ? { cost: entered.cost } : {}),
    ...(entered.degreeProgram ? { degreeProgram: entered.degreeProgram } : {}),
  },
  ...(entered.eligibleCost ? { eligibleCost: entered.eligibleCost } : {}),
});

/**
 * The Application form. A Draft may be saved as incomplete as the Applicant likes
 * and picked up again later, so nothing is required to save one; submitting is
 * what requires a whole Course.
 *
 * Both checks the form makes before submitting — every required Course detail
 * present, and the Course not yet started — are there so the Applicant is told
 * what to fix without a round trip. The backend makes the same two decisions, and
 * its answer is the one that counts.
 */
export function ApplicationForm() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const form = useRef<HTMLFormElement>(null);
  const intent = useRef<"save" | "submit">("save");

  const [entered, setEntered] = useState<Entered>(NOTHING_ENTERED);
  const [loaded, setLoaded] = useState(applicationId === undefined);
  const [missing, setMissing] = useState<readonly string[]>([]);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => (form.current ? syncUserInvalidWithAria(form.current) : undefined), [loaded]);

  useEffect(() => {
    if (applicationId === undefined) return;
    let current = true;
    api
      .GET("/applications/{applicationId}", { params: { path: { applicationId } } })
      .then(({ data, response }) => {
        if (!current) return;
        if (data) {
          setEntered({
            institution: data.course.institution ?? "",
            title: data.course.title ?? "",
            startDate: data.course.startDate ?? "",
            endDate: data.course.endDate ?? "",
            cost: data.course.cost ?? "",
            degreeProgram: data.course.degreeProgram ?? "",
            eligibleCost: data.eligibleCost ?? "",
          });
        } else {
          setRefusal(`This Draft could not be read: the API answered ${response.status}.`);
        }
        setLoaded(true);
      });
    return () => {
      current = false;
    };
  }, [applicationId]);

  const change = (field: keyof Entered) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setEntered((was) => ({ ...was, [field]: event.target.value }));

  async function save(): Promise<string | null> {
    const body = asDraft(entered);
    const answer = applicationId
      ? await api.PATCH("/applications/{applicationId}", {
          params: { path: { applicationId } },
          body,
        })
      : await api.POST("/applications", { body });
    if (!answer.data) {
      setRefusal(
        answer.error?.detail ??
          answer.error?.title ??
          `This Application could not be saved: the API answered ${answer.response.status}.`,
      );
      return null;
    }
    return answer.data.applicationId;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRefusal(null);
    setMissing([]);

    if (intent.current === "submit") {
      const absent = REQUIRED.filter(({ field }) => entered[field].trim() === "");
      if (absent.length > 0) {
        setMissing(absent.map(({ message }) => message));
        // A failed submit routes focus to the first field at fault, so that its
        // problem is read out (accessible-error-announcement).
        document.getElementById(absent[0]?.field ?? "")?.focus();
        return;
      }
      if (hasArrived(entered.startDate)) {
        setRefusal(
          `This Course starts on ${readableDate(entered.startDate)}, which is not in the future. ` +
            "Pre-approval must come before the Course starts, so this Application can no longer " +
            "be submitted.",
        );
        document.getElementById("startDate")?.focus();
        return;
      }
    }

    setWorking(true);
    try {
      const saved = await save();
      if (saved === null) return;
      if (intent.current === "submit") {
        const submitted = await api.POST("/applications/{applicationId}/submit", {
          params: { path: { applicationId: saved } },
        });
        if (!submitted.data) {
          setRefusal(
            submitted.error?.detail ??
              submitted.error?.title ??
              `This Application could not be submitted: the API answered ${submitted.response.status}.`,
          );
          return;
        }
        toast.success("Application submitted", {
          description: "It is now waiting for Pre-approval.",
        });
      } else {
        toast.success("Draft saved", { description: "Come back to it whenever you like." });
      }
      navigate(`/applications/${saved}`);
    } finally {
      setWorking(false);
    }
  }

  if (!loaded) {
    return (
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Reading this Draft…
      </p>
    );
  }

  return (
    <>
      <h1 className="font-heading text-2xl font-medium tracking-tight">
        {applicationId ? "Change this Draft" : "Start an Application"}
      </h1>
      <p className="text-sm text-muted-foreground">
        A Draft is yours alone until you submit it, so you can save it half-finished and come back.
        Everything below is needed before you can submit.
      </p>

      {/* The one place a refused submit is reported, and the only thing on this
          screen that carries the alert role, so that it is what a test and a
          screen reader both find (accessible-error-announcement). */}
      {(missing.length > 0 || refusal !== null) && (
        <Alert variant="destructive" className="w-full max-w-2xl">
          {missing.length > 0 && (
            <>
              <AlertTitle>Add these Course details before submitting:</AlertTitle>
              <AlertDescription>
                <ul className="flex list-disc flex-col gap-1 ps-5">
                  {missing.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </>
          )}
          {refusal !== null && <AlertTitle>{refusal}</AlertTitle>}
        </Alert>
      )}

      <form ref={form} onSubmit={onSubmit} className="w-full max-w-2xl" noValidate>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Course</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="institution">Institution</FieldLabel>
                <Input
                  className="peer"
                  type="text"
                  id="institution"
                  name="institution"
                  autoComplete="organization"
                  required
                  data-error="institution-error"
                  value={entered.institution}
                  onChange={change("institution")}
                />
                <span id="institution-error" className={ERROR_MESSAGE}>
                  Error: name the school or college teaching the Course.
                </span>
              </Field>

              <Field>
                <FieldLabel htmlFor="title">Course title</FieldLabel>
                <Input
                  className="peer"
                  type="text"
                  id="title"
                  name="title"
                  required
                  data-error="title-error"
                  value={entered.title}
                  onChange={change("title")}
                />
                <span id="title-error" className={ERROR_MESSAGE}>
                  Error: enter what the Course is called.
                </span>
              </Field>

              <Field>
                <FieldLabel htmlFor="startDate">Start date</FieldLabel>
                <FieldDescription id="startDate-hint">
                  Pre-approval comes first, so the Course has to start after today.
                </FieldDescription>
                {/* The browser's own date field, kept rather than replaced: it
                    knows the Person's calendar and locale, and it is reachable
                    from the keyboard a segment at a time. */}
                <Input
                  className="peer"
                  type="date"
                  id="startDate"
                  name="startDate"
                  min={tomorrow()}
                  required
                  aria-describedby="startDate-hint"
                  data-error="startDate-error"
                  value={entered.startDate}
                  onChange={change("startDate")}
                />
                <span id="startDate-error" className={ERROR_MESSAGE}>
                  Error: enter the day the Course starts, which must be after today.
                </span>
              </Field>

              <Field>
                <FieldLabel htmlFor="endDate">End date</FieldLabel>
                <Input
                  className="peer"
                  type="date"
                  id="endDate"
                  name="endDate"
                  min={entered.startDate || tomorrow()}
                  required
                  data-error="endDate-error"
                  value={entered.endDate}
                  onChange={change("endDate")}
                />
                <span id="endDate-error" className={ERROR_MESSAGE}>
                  Error: enter the day the Course ends.
                </span>
              </Field>

              <Field>
                <FieldLabel htmlFor="cost">Course cost</FieldLabel>
                <FieldDescription id="cost-hint">
                  The whole cost of the Course, to two decimal places, for example 2400.00.
                </FieldDescription>
                <Input
                  className="peer"
                  type="text"
                  id="cost"
                  name="cost"
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  pattern={AMOUNT}
                  required
                  aria-describedby="cost-hint"
                  data-error="cost-error"
                  value={entered.cost}
                  onChange={change("cost")}
                />
                <span id="cost-error" className={ERROR_MESSAGE}>
                  Error: enter an amount with two decimal places, for example 2400.00.
                </span>
              </Field>

              <Field>
                <FieldLabel htmlFor="degreeProgram">Degree program (optional)</FieldLabel>
                <Input
                  type="text"
                  id="degreeProgram"
                  name="degreeProgram"
                  value={entered.degreeProgram}
                  onChange={change("degreeProgram")}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <Field>
            <FieldLabel htmlFor="eligibleCost">Eligible Cost</FieldLabel>
            <FieldDescription id="eligibleCost-hint">
              The part of the cost the Program will reimburse: tuition plus required fees. Books are
              never Eligible Costs.
            </FieldDescription>
            <Input
              className="peer"
              type="text"
              id="eligibleCost"
              name="eligibleCost"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              pattern={AMOUNT}
              required
              aria-describedby="eligibleCost-hint"
              data-error="eligibleCost-error"
              value={entered.eligibleCost}
              onChange={change("eligibleCost")}
            />
            <span id="eligibleCost-error" className={ERROR_MESSAGE}>
              Error: enter an amount with two decimal places, for example 2250.00.
            </span>
          </Field>

          {/* Submitting is the thing the Applicant came to do; saving a Draft is
              the way out of it, so only one of the two is the loud button. */}
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              variant="outline"
              onClick={() => (intent.current = "save")}
              disabled={working}
            >
              Save Draft
            </Button>
            <Button type="submit" onClick={() => (intent.current = "submit")} disabled={working}>
              Submit for Pre-approval
            </Button>
          </div>
        </FieldGroup>
      </form>
    </>
  );
}
