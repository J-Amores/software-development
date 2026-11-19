-- Persons: anyone with an account in the system.
--
-- One DDL statement, no DML (ADR 0007): Aurora DSQL allows one DDL statement per
-- transaction and Flyway runs each file in one. The key is a UUID the application
-- generates, because DSQL has no sequences and no identity columns (ADR 0003).
--
-- cognito_subject is who this Person is to the user pool. It is unique and it
-- stays in this table: every other table refers to a Person by person_id, so
-- moving to another identity provider would not touch them.
--
-- No foreign keys anywhere in this schema. Aurora DSQL does not support them, and
-- a constraint that holds locally but not in the deployed database would make the
-- local stack a weaker test than it looks.
create table persons (
  person_id uuid primary key,
  cognito_subject text not null unique,
  display_name text not null,
  email text,
  created_at timestamp with time zone not null
);
