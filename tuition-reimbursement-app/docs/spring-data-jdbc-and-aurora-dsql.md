# Spring Data JDBC on Aurora DSQL

A tutorial, written from building the first slice that introduces tables (ticket 02). It explains what Spring Data JDBC does for this project, what Aurora DSQL will not let it do, and the small number of decisions that follow. Terms are defined in [GLOSSARY.md](../GLOSSARY.md); the reasoning behind the choices is in [ADR 0003](adr/0003-serverless-always-free-deployment.md) and [ADR 0007](adr/0007-spring-data-jdbc-and-single-ddl-migrations.md).

Read this before adding a table or an aggregate. It will save you the hours ticket 02 spent finding these edges.

## Why not JPA

Aurora DSQL is a distributed SQL database that speaks the Postgres wire protocol but supports a subset of Postgres. The subset is the whole problem: anything the app relies on that DSQL does not have works perfectly in the local Postgres container and fails only once the stack is deployed.

JPA makes that failure mode worse, because it writes SQL you did not. An `@OneToMany` becomes a join or a second select depending on fetch mode, a `@GeneratedValue` becomes a sequence, and an entity lifecycle callback becomes a trigger-shaped habit. You cannot keep code inside a subset you cannot see.

Spring Data JDBC does far less. It maps an aggregate to rows, and the SQL it generates is predictable enough to reason about: one select for the root, one per collection, and delete-then-insert for the children of an aggregate you save. That is the entire mental model, and it is small enough to check against DSQL's limits.

The cost is real. There is no lazy loading, no dirty checking, no second-level cache and no `merge`. Every read loads the whole aggregate, and every write replaces it.

## Aggregates: what belongs in one

Spring Data JDBC only persists aggregates. An aggregate is a root entity plus the things that have no life without it, and it is the unit of loading, saving and locking. The rule to apply: if you would never read it without the root, and never let anyone else hold a reference to it, it is part of the aggregate.

In this slice:

- **An Application and its Status Changes are one aggregate.** A Timeline is only ever read with the Application it belongs to, nothing else refers to a Status Change, and the Application is the only thing that creates one. `Application` holds `Set<StatusChange>` through `@MappedCollection`.
- **A Course is part of the Application row.** An Application is for exactly one Course and a Course has no life without it, so the Course is `@Embedded` rather than a table of its own. Its columns get a `course_` prefix.
- **A Person is a separate aggregate.** Applications refer to the Applicant by their `person_id` and nothing more. Spring Data JDBC has no `@ManyToOne` across aggregates, and that is the point: the reference is an id, and reading an Application does not drag a Person along with it.

Two things follow that tend to surprise people.

**Children are replaced, not updated.** `applications.save(application)` deletes every row in `status_changes` for that Application and inserts the collection again. It is correct, and it is why a Status Change's `status_change_id` is generated fresh on each save rather than being a stable identifier anything else could keep. Nothing outside the aggregate may refer to a Status Change by id.

**The whole aggregate is the unit of concurrency.** Two requests that both submit the same Application are two read-modify-write cycles over the same rows. Locally Postgres lets both through; on DSQL one of them fails with a concurrency error and has to be retried. The money rules in later slices depend on that behavior, so they will want `@Version` on the root. Ticket 02 does not need it, because the only transition it makes is guarded by the status check that precedes it.

### Mapping an embedded value

```java
@Embedded.Nullable(prefix = "course_") private Course course;
```

`@Embedded.Nullable` means: when every one of the embedded columns is null, the field reads back as `null` rather than as an object full of nulls. That is the right behavior for a Draft nobody has filled in yet, but it makes the field nullable in Java, and the code that reads it has to cope. `Application.course()` hands back an empty `Course` instead of null, so no caller has to.

`@Embedded(onEmpty = USE_EMPTY)` is the alternative, and it is tempting. It is the wrong default here: it erases the difference between "the Applicant entered nothing" and a Course that happens to be blank, and with a record it depends on every component type being nullable anyway.

## Keys: generate them in Java

DSQL has no sequences, no identity columns and no `serial`. The CI guard `tools/ci/check-dsql-sql.sh` rejects all of them by name. So every key in this schema is a UUID the application generates:

```java
UUID.randomUUID()
```

That collides with how Spring Data JDBC decides between an insert and an update. By default it looks at the id: null means new, non-null means existing. So `save()` on a freshly built entity whose key is already set issues an `UPDATE`, matches no row, and throws — the error reads roughly "Failed to update table [applications]".

There are three ways out, and only one suits this slice:

| Approach | What it does | Why not, or why |
| --- | --- | --- |
| `@Version Long version` | A null version means new, and you get optimistic locking with it | The right answer for a slice that needs the locking. It adds a column and a meaning this slice does not use. |
| `implements Persistable<UUID>` | You answer `isNew()` yourself | **What this slice does.** No extra column, and the answer is exactly as truthful as the factory method that sets it. |
| A `BeforeConvertCallback` that assigns the id | Keeps the id null until just before the insert | The id then does not exist while the object does, so nothing in the domain can use it. |

The `Persistable` version is four lines and a flag:

```java
@Transient private boolean justStarted;

@Override public UUID getId() { return applicationId; }
@Override public boolean isNew() { return justStarted; }
```

Only the factory method that starts a new Application sets the flag. An Application that Spring Data JDBC materialized from a row never has it set, because `@Transient` fields are not populated — which is the behavior you want, and also the reason the flag cannot be a constructor parameter. Spring Data JDBC reads rows through the single all-args constructor, and it has no value to pass for a transient field.

`PersonRecord` does the same thing for the same reason.

### Two identifiers for a Person, deliberately

A Person has an application-generated `person_id` and a unique `cognito_subject`. They are not interchangeable:

- `cognito_subject` is the `sub` claim of the token, which is how the Cognito user pool knows them. It stays inside the `people` module; no other table records it.
- `person_id` is what everything else refers to them by: an Application's Applicant, a Status Change's actor.

`SignedInPerson.personId` in the `platform` module is the Cognito subject, not this UUID, which is a genuine trap: the names agree and the values do not. Everything that stores a reference to a Person goes through `People.personWithSubject(...)` and stores the UUID it returns. The payoff is that moving to a different identity provider would touch one column in one table.

## Migrations: one statement, no data

DSQL allows one DDL statement per transaction, and refuses DDL and DML in the same transaction. Flyway runs each file in one transaction. So: **one statement per file, and no `insert`, `update`, `delete` or `merge` in a migration, ever.**

`tools/ci/check-dsql-sql.sh` enforces this, and its rules are worth knowing before you fight it:

- It strips `--` comments and then counts statements by splitting on `;`. Exactly one non-blank segment, or it fails. A trailing semicolon is fine, and zero statements fails too.
- It does **not** strip `/* */` block comments, so a semicolon inside one counts as a statement break. Use `--`.
- The DML check is a plain substring match, and one of the strings it looks for is `update ` with a trailing space. That means **`ON UPDATE CASCADE` trips it**. Do not write `ON UPDATE` in this schema, and name a timestamp column `updated_at`.
- The unsupported-feature check matches on word boundaries, so `material_cost` and `serial_number` are safe column names.

In practice:

- One `CREATE TABLE` per file. Constraints written inside the `CREATE TABLE` — `primary key`, `not null`, `unique` — are part of that one statement, so they cost nothing.
- Every `CREATE INDEX` is its own file. Slice 02's five files are three tables and two indexes.
- Seed data is not a migration. The demo data is loaded by the seed script and the Faker fixtures, outside Flyway.
- Flyway's own naming, `V<n>__<description>.sql`. The guard enforces no convention; Flyway does.

### Foreign keys: don't

DSQL does not support foreign key constraints. The guard tolerates them, because it only rejects the features that break outright — which makes this the most dangerous gap in the toolchain. A `references` clause works in the local Postgres container, passes CI, and is simply absent in the deployed database.

So this schema has no foreign keys at all, including on `status_changes.application_id`, which is an aggregate back-reference and the most obviously key-shaped column in it. Referential integrity is the application's job: the aggregate is the only thing that writes `status_changes`, and it never writes one without an Application.

Put an index where a foreign key would have gone. The lookups a foreign key would have made fast still need to be fast.

### `baseline-on-migrate` will lie to you

`spring.flyway.baseline-on-migrate: true` with `fail-on-missing-locations: false` fails silently in two different ways:

- A mistyped `locations` runs zero migrations and reports success. `GET /api/health` still says Postgres is up, because it counts rows in `flyway_schema_history` and zero is a number.
- If the schema is non-empty and has no history table, Flyway writes a baseline at version 1 and skips everything up to it.

If migrations seem not to have run locally, `./dev down -v` drops the `postgres-data` volume and starts clean. In tests the question never arises: every run gets a fresh Testcontainers Postgres.

## What else DSQL will not do

Beyond keys and migrations, the limits that shape code rather than schema:

| Postgres allows | DSQL | Consequence here |
| --- | --- | --- |
| Sequences, `serial`, identity columns | No | Keys are UUIDs generated in Java. |
| Triggers, functions, stored procedures | No | `updated_at` is set by the application on every change. Nothing is computed in the database. |
| Foreign keys | No | Referential integrity is the aggregate's job. |
| Several DDL statements per transaction | No | One statement per migration. |
| DDL and DML in one transaction | No | No seed data in migrations. |
| Long-running transactions | Limited | Keep a request's work inside one short transaction. Nothing in this app needs more. |
| Last writer wins on a conflict | No: optimistic concurrency | A conflicting transaction fails and has to be retried. The money rules depend on this; see [SPEC.md](SPEC.md), Money rules. |

## Types, and why amounts are strings on the wire

Money is `numeric(12, 2)` in the database and `BigDecimal` in Java, from the moment a request is read to the moment a response is written. No amount passes through a `double` or a `float` anywhere in this codebase.

That is why the contract types every amount as a `string` matching `^[0-9]+\.[0-9]{2}$` rather than as a number. A JSON number becomes a binary float in any client that parses it loosely, and an Approved Amount has to be exact to the cent. `Amounts.read` and `Amounts.write` are the only two places that cross that boundary.

Timestamps are `timestamp with time zone`, which Spring Data JDBC maps to `Instant` with no configuration. Dates that are dates rather than moments — a Course's start and end — are `date` and `LocalDate`. The application never calls `Instant.now()`: it reads the time from the injected `Clock`, whose zone is the Employer's, because that is where the Program counts Business Days.

## Deriving queries

`CrudRepository` plus derived query methods covers everything this slice needs:

```java
List<Application> findByApplicantPersonIdOrderByUpdatedAtDesc(UUID applicantPersonId);
```

Camel case maps to snake case, so `applicantPersonId` finds `applicant_person_id`. A derived query on an aggregate root loads each root's collections too, which is one extra select per Application returned. For an Applicant's own list that is fine. For a Benefits Coordinator's queue over every open Application it will not be, and the answer then is a `@Query` returning a projection that is not the aggregate — not a cleverer mapping.

Table names are derived from the class name and are singular, which is the one mapping mistake most likely to cost you an afternoon: a child entity class `StatusChange` looks for a table called `status_change`, and the error surfaces as a `BadSqlGrammarException` on a read, long after the insert appeared to work. Put `@Table("<plural>")` on every entity, children included, and the question never comes up.

## Checklist for the next slice that adds a table

1. Decide the aggregate: what is the root, what has no life without it, and what is only a reference by id.
2. One `CREATE TABLE` per migration file, `V<n>__<description>.sql`, `--` comments only, no foreign keys, no `ON UPDATE`.
3. Each `CREATE INDEX` in its own file. Add one where a foreign key would have been.
4. `@Table("<plural>")` on every entity, children included.
5. UUID keys generated in Java, with `Persistable` — or `@Version`, if the slice needs optimistic locking.
6. `@Embedded.Nullable(prefix = "...")` for a value object that lives in the root's row, and a getter that hands back an empty one rather than null.
7. Amounts `numeric` and `BigDecimal`; times from the injected `Clock`.
8. Run `tools/ci/check-dsql-sql.sh` from the git root before committing. It takes a second, and CI runs it anyway.
