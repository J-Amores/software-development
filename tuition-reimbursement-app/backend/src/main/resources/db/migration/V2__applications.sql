-- Applications, with the Course each one is for.
--
-- The Course lives in these columns rather than a table of its own: an Application
-- is for exactly one Course and a Course has no life without it, so they are one
-- aggregate and one row. The course_ prefix is what Spring Data JDBC maps the
-- embedded Course onto.
--
-- Every Course column is nullable because a Draft is filled in over several
-- visits; completeness is a rule submission enforces, not one the table does.
--
-- Amounts are numeric and never floating point: an amount has to be exact to the
-- cent. updated_at is maintained by the application, not by a trigger, which
-- Aurora DSQL does not support (ADR 0003).
create table applications (
  application_id uuid primary key,
  applicant_person_id uuid not null,
  status text not null,
  course_institution text,
  course_title text,
  course_start_date date,
  course_end_date date,
  course_cost numeric(12, 2),
  course_degree_program text,
  eligible_cost numeric(12, 2),
  created_at timestamp with time zone not null,
  updated_at timestamp with time zone not null
);
