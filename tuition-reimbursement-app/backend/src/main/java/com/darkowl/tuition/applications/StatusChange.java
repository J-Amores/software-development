package com.darkowl.tuition.applications;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/**
 * A recorded move of an Application from one status to another: who made it, when,
 * and why. One entry of a Timeline.
 *
 * <p>Part of the Application aggregate, never saved or read on its own (ADR 0007).
 * The actor is a Person's UUID, and their name is kept beside it so a Timeline
 * still reads correctly years later.
 *
 * @param statusChangeId the key, a UUID this application generated
 * @param timelinePosition where this Status Change comes in the Timeline, from zero
 * @param statusFrom the status it moved from, absent only if an Application ever starts elsewhere
 * @param statusTo the status it moved to
 * @param actorPersonId the Person who made it, absent where the system made it
 * @param actorName that Person's display name, or the system
 * @param changedAt the instant it was made, from the injected clock
 * @param reason why it was made, required for Rejected and Returned alone
 */
@Table("status_changes")
record StatusChange(
    @Id UUID statusChangeId,
    int timelinePosition,
    ApplicationStatus statusFrom,
    ApplicationStatus statusTo,
    UUID actorPersonId,
    String actorName,
    Instant changedAt,
    String reason) {

  static StatusChange recorded(
      int timelinePosition,
      ApplicationStatus from,
      ApplicationStatus to,
      UUID actorPersonId,
      String actorName,
      Instant at,
      String reason) {
    return new StatusChange(
        UUID.randomUUID(), timelinePosition, from, to, actorPersonId, actorName, at, reason);
  }

  com.darkowl.contract.model.StatusChange asContract() {
    com.darkowl.contract.model.StatusChange entry =
        new com.darkowl.contract.model.StatusChange(statusTo.asContract(), actorName, changedAt);
    if (statusFrom != null) {
      entry.setFrom(statusFrom.asContract());
    }
    entry.setReason(reason);
    return entry;
  }
}
