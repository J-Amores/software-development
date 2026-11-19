import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../api/client";
import type { components } from "../api/generated/schema";
import { statusWord } from "../applications/status";
import { readableDate } from "../time/plainDates";

type ApplicationSummary = components["schemas"]["ApplicationSummary"];

/** What a Draft shows in a column it has nothing in yet. */
const NOT_YET = "—";

/**
 * The Applicant's own Applications, each with where it stands. An Applicant with
 * none is told how to start one instead of being shown an empty table: a table of
 * headings and no rows says nothing about what to do next.
 */
export function MyApplications() {
  const [applications, setApplications] = useState<ApplicationSummary[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    api.GET("/applications").then(({ data, response }) => {
      if (!current) return;
      if (data) setApplications(data);
      else setProblem(`Your Applications could not be read: the API answered ${response.status}.`);
    });
    return () => {
      current = false;
    };
  }, []);

  if (problem) {
    return (
      <>
        <h1>My Applications</h1>
        <p role="alert" className="refusal">
          {problem}
        </p>
      </>
    );
  }

  if (applications === null) {
    return (
      <>
        <h1>My Applications</h1>
        <p role="status" aria-live="polite">
          Reading your Applications…
        </p>
      </>
    );
  }

  if (applications.length === 0) {
    return (
      <>
        <h1>My Applications</h1>
        <p className="lede">
          You have nothing here yet. Start an Application to have the tuition for a Course
          reimbursed: enter the Course, keep it as a Draft for as long as you need, and submit it
          before the Course starts.
        </p>
        <p>
          <Link to="/applications/new" className="call">
            Start an Application
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1>My Applications</h1>
      <p>
        <Link to="/applications/new" className="call">
          Start an Application
        </Link>
      </p>
      {/* The wrapper is focusable and named so that it can be scrolled from the
          keyboard when the columns do not fit (responsive-table). */}
      <div tabIndex={0} role="region" aria-labelledby="my-applications-caption" className="table-wrap">
        <table>
          <caption id="my-applications-caption" className="visually-hidden">
            Every Application you have, and where each one stands
          </caption>
          <thead>
            <tr>
              <th scope="col">Course</th>
              <th scope="col">Institution</th>
              <th scope="col">Starts</th>
              <th scope="col">Eligible Cost</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.applicationId}>
                <th scope="row">
                  <Link to={`/applications/${application.applicationId}`}>
                    {application.courseTitle ?? "A Draft with no Course title yet"}
                  </Link>
                </th>
                {/* `data-column` is the column's name for the stacked layout the
                    stylesheet falls back to when the columns no longer fit. */}
                <td data-column="Institution">{application.courseInstitution ?? NOT_YET}</td>
                <td data-column="Starts">
                  {application.courseStartDate ? readableDate(application.courseStartDate) : NOT_YET}
                </td>
                <td data-column="Eligible Cost">{application.eligibleCost ?? NOT_YET}</td>
                <td data-column="Status">{statusWord(application.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
