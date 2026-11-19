package com.darkowl.tuition.people.internal;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

/**
 * A Person as the Persons table holds them.
 *
 * <p>The key is generated here rather than by the database: Aurora DSQL has no
 * sequences and no identity columns (ADR 0003). That leaves Spring Data JDBC
 * unable to tell a new row from an existing one by a null key, which is what
 * {@link Persistable} answers.
 */
@Table("persons")
class PersonRecord implements Persistable<UUID> {

  @Id private final UUID personId;
  private final String cognitoSubject;
  private String displayName;
  private String email;
  private final Instant createdAt;

  @Transient private boolean justSeenForTheFirstTime;

  PersonRecord(
      UUID personId, String cognitoSubject, String displayName, String email, Instant createdAt) {
    this.personId = personId;
    this.cognitoSubject = cognitoSubject;
    this.displayName = displayName;
    this.email = email;
    this.createdAt = createdAt;
  }

  static PersonRecord firstSightOf(
      String cognitoSubject, String displayName, String email, Instant at) {
    PersonRecord person =
        new PersonRecord(UUID.randomUUID(), cognitoSubject, displayName, email, at);
    person.justSeenForTheFirstTime = true;
    return person;
  }

  /** Follows what the Employer account says, rather than keeping a stale copy. */
  boolean renameTo(String displayName, String email) {
    boolean changed = !equal(this.displayName, displayName) || !equal(this.email, email);
    this.displayName = displayName;
    this.email = email;
    return changed;
  }

  UUID personId() {
    return personId;
  }

  String displayName() {
    return displayName;
  }

  String email() {
    return email;
  }

  @Override
  public UUID getId() {
    return personId;
  }

  @Override
  public boolean isNew() {
    return justSeenForTheFirstTime;
  }

  private static boolean equal(String one, String other) {
    return one == null ? other == null : one.equals(other);
  }
}
