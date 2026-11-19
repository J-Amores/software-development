-- An Applicant asking for their own Applications is the commonest read in the
-- app, and it is the query that keeps one Person's Applications out of another's
-- list. Its own file: one statement per migration (ADR 0007).
create index applications_by_applicant on applications (applicant_person_id);
