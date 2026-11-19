import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api/client";
import type { components } from "../api/generated/schema";
import { statusWord } from "../applications/status";
import { readableDate, readableInstant } from "../time/plainDates";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Application = components["schemas"]["Application"];

const NOT_YET = "Not entered yet";

/**
 * One Application: the Course it is for, where it stands, and its Timeline. The
 * Timeline is the Applicant's own record of what happened to the Application, so
 * every entry names who made the Status Change, when, and why when there is a why.
 */
export function ApplicationDetail() {
  const { applicationId = "" } = useParams();
  const [application, setApplication] = useState<Application | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    api
      .GET("/applications/{applicationId}", { params: { path: { applicationId } } })
      .then(({ data, response }) => {
        if (!current) return;
        if (data) setApplication(data);
        else setProblem(`This Application could not be read: the API answered ${response.status}.`);
      });
    return () => {
      current = false;
    };
  }, [applicationId]);

  if (problem) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{problem}</AlertTitle>
      </Alert>
    );
  }

  if (!application) {
    return (
      <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
        Reading this Application…
      </p>
    );
  }

  const { course } = application;

  return (
    <>
      <h1 className="font-heading text-2xl font-medium tracking-tight">
        {course.title ?? "A Draft with no Course title yet"}
      </h1>
      {/* The status reads as one phrase, so the whole phrase is what is marked:
          "Status" without its value is not a thing anyone needs to read. */}
      <Badge variant={application.status === "draft" ? "secondary" : "default"}>
        Status: {statusWord(application.status)}
      </Badge>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <h2>Course</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Institution</dt>
            <dd>{course.institution ?? NOT_YET}</dd>
            <dt className="text-muted-foreground">Course title</dt>
            <dd>{course.title ?? NOT_YET}</dd>
            <dt className="text-muted-foreground">Starts</dt>
            <dd>{course.startDate ? readableDate(course.startDate) : NOT_YET}</dd>
            <dt className="text-muted-foreground">Ends</dt>
            <dd>{course.endDate ? readableDate(course.endDate) : NOT_YET}</dd>
            <dt className="text-muted-foreground">Course cost</dt>
            <dd>{course.cost ?? NOT_YET}</dd>
            <dt className="text-muted-foreground">Degree program</dt>
            <dd>{course.degreeProgram ?? "This Course is not part of one"}</dd>
            <dt className="text-muted-foreground">Eligible Cost</dt>
            <dd>{application.eligibleCost ?? NOT_YET}</dd>
          </dl>
        </CardContent>
      </Card>

      {application.status === "draft" && (
        <Link
          to={`/applications/${application.applicationId}/edit`}
          className={buttonVariants()}
        >
          Change this Draft
        </Link>
      )}

      <h2 id="timeline-heading" className="font-heading text-lg font-medium">
        Timeline
      </h2>
      {application.timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing has happened to this Application yet. It is still a Draft only you can see.
        </p>
      ) : (
        <ol
          className="flex list-disc flex-col gap-3 ps-5"
          aria-labelledby="timeline-heading"
        >
          {application.timeline.map((change) => (
            <li key={`${change.at}-${change.to}`}>
              <p>
                Moved to {statusWord(change.to)} by {change.actorName} on{" "}
                <time dateTime={change.at}>{readableInstant(change.at)}</time>
              </p>
              {change.reason ? (
                <p className="text-sm text-muted-foreground">Reason: {change.reason}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
