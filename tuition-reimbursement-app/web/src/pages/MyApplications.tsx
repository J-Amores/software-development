import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../api/client";
import type { components } from "../api/generated/schema";
import { statusTone, statusWord } from "../applications/status";
import { readableDate } from "../time/plainDates";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ApplicationSummary = components["schemas"]["ApplicationSummary"];

/**
 * What a cell shows where a Draft has nothing entered yet. A dash, because a
 * column of words repeated down every empty cell is harder to read past than a
 * column of dashes; the Application's own screen has the room to say it in words.
 */
const EMPTY_CELL = "—";

/** The screen's one heading, the same whatever the Applicant's Applications are. */
const heading = (
  <h1 className="font-heading text-2xl font-medium tracking-tight">My Applications</h1>
);

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
        {heading}
        <Alert variant="destructive">
          <AlertTitle>{problem}</AlertTitle>
        </Alert>
      </>
    );
  }

  if (applications === null) {
    return (
      <>
        {heading}
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Reading your Applications…
        </p>
      </>
    );
  }

  if (applications.length === 0) {
    return (
      <>
        {heading}
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>You have nothing here yet</EmptyTitle>
            <EmptyDescription>
              Start an Application to have the tuition for a Course reimbursed: enter the Course,
              keep it as a Draft for as long as you need, and submit it before the Course starts.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/applications/new" className={buttonVariants()}>
              Start an Application
            </Link>
          </EmptyContent>
        </Empty>
      </>
    );
  }

  return (
    <>
      {heading}
      <p>
        <Link to="/applications/new" className={buttonVariants()}>
          Start an Application
        </Link>
      </p>
      {/* The element that scrolls is focusable and named, so that it can be
          scrolled from the keyboard when the columns do not fit, and it is the
          container the stylesheet measures to decide when each Application
          becomes a block instead (responsive-table). */}
      <Table
        container={{
          tabIndex: 0,
          role: "region",
          "aria-labelledby": "my-applications-caption",
          className: "@container",
        }}
      >
        <TableCaption id="my-applications-caption" className="sr-only">
          Every Application you have, and where each one stands
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Course</TableHead>
            <TableHead scope="col">Institution</TableHead>
            <TableHead scope="col">Starts</TableHead>
            <TableHead scope="col">Eligible Cost</TableHead>
            <TableHead scope="col">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.applicationId}>
              <TableHead scope="row" className="font-normal">
                <Link
                  to={`/applications/${application.applicationId}`}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {application.courseTitle ?? "A Draft with no Course title yet"}
                </Link>
              </TableHead>
              {/* `data-column` is the column's name for the stacked layout the
                  stylesheet falls back to when the columns no longer fit. */}
              <TableCell data-column="Institution">
                {application.courseInstitution ?? EMPTY_CELL}
              </TableCell>
              <TableCell data-column="Starts">
                {application.courseStartDate
                  ? readableDate(application.courseStartDate)
                  : EMPTY_CELL}
              </TableCell>
              <TableCell data-column="Eligible Cost">
                {application.eligibleCost ?? EMPTY_CELL}
              </TableCell>
              <TableCell data-column="Status">
                <Badge variant={statusTone(application.status)}>
                  {statusWord(application.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
