-- Status Changes: the Timeline of an Application.
--
-- Part of the Application aggregate (ADR 0007), so these rows are only ever read
-- and written with the Application they belong to. application_id is the
-- aggregate's back reference; there is no foreign key, because Aurora DSQL has
-- none.
--
-- timeline_position is what puts a Timeline in order. Two Status Changes can share
-- an instant, so changed_at alone would not settle it.
--
-- actor_name is kept beside actor_person_id on purpose: a Timeline has to read
-- correctly years later, whatever has happened to the Person's account since.
create table status_changes (
  status_change_id uuid primary key,
  application_id uuid not null,
  timeline_position integer not null,
  status_from text,
  status_to text not null,
  actor_person_id uuid,
  actor_name text not null,
  changed_at timestamp with time zone not null,
  reason text
);
