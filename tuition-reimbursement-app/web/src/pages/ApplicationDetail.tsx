import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api } from "../api/client";
import type { components } from "../api/generated/schema";
import { statusWord } from "../applications/status";
import { readableDate, readableInstant } from "../time/plainDates";

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
      <p role="alert" className="refusal">
        {problem}
      </p>
    );
  }

  if (!application) {
    return (
      <p role="status" aria-live="polite">
        Reading this Application…
      </p>
    );
  }

  const { course } = application;

  return (
    <>
      <h1>{course.title ?? "A Draft with no Course title yet"}</h1>
      <p className="status">Status: {statusWord(application.status)}</p>

      <h2>Course</h2>
      <dl className="details">
        <dt>Institution</dt>
        <dd>{course.institution ?? NOT_YET}</dd>
        <dt>Course title</dt>
        <dd>{course.title ?? NOT_YET}</dd>
        <dt>Starts</dt>
        <dd>{course.startDate ? readableDate(course.startDate) : NOT_YET}</dd>
        <dt>Ends</dt>
        <dd>{course.endDate ? readableDate(course.endDate) : NOT_YET}</dd>
        <dt>Course cost</dt>
        <dd>{course.cost ?? NOT_YET}</dd>
        <dt>Degree program</dt>
        <dd>{course.degreeProgram ?? "This Course is not part of one"}</dd>
        <dt>Eligible Cost</dt>
        <dd>{application.eligibleCost ?? NOT_YET}</dd>
      </dl>

      {application.status === "draft" && (
        <p>
          <Link to={`/applications/${application.applicationId}/edit`} className="call">
            Change this Draft
          </Link>
        </p>
      )}

      <h2 id="timeline-heading">Timeline</h2>
      {application.timeline.length === 0 ? (
        <p>Nothing has happened to this Application yet. It is still a Draft only you can see.</p>
      ) : (
        <ol className="timeline" aria-labelledby="timeline-heading">
          {application.timeline.map((change) => (
            <li key={`${change.at}-${change.to}`}>
              <p>
                Moved to {statusWord(change.to)} by {change.actorName} on{" "}
                <time dateTime={change.at}>{readableInstant(change.at)}</time>
              </p>
              {change.reason ? <p className="reason">Reason: {change.reason}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
