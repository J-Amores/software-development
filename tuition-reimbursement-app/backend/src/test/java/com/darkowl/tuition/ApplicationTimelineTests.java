package com.darkowl.tuition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

/**
 * An Applicant opens one Application and reads its Timeline (ticket 02, test 14).
 */
class ApplicationTimelineTests extends ApiTest {

  /**
   * 14. An Applicant reads one Application and sees its Timeline: every Status
   * Change in order, with who made it, when and why.
   *
   * <p>Only one Status Change is possible in this slice, so "in order" is all the
   * Timeline can show here: the entry is the move it recorded, with the Applicant
   * who made it, the time the clock read and no reason, because a reason is only
   * required for Rejected and Returned.
   */
  @Test
  void anApplicationsTimelineIsItsStatusChangesInOrder() {
    Instant whenTheySubmitted = Instant.parse("2026-11-19T09:30:00Z");
    String applicationId =
        as(LocalAws.ADA).post("/applications", Drafts.aCompleteDraft()).text("applicationId");
    assertThat(as(LocalAws.ADA).get("/applications/" + applicationId).list("timeline")).isEmpty();

    now(whenTheySubmitted);
    assertThat(as(LocalAws.ADA).post("/applications/" + applicationId + "/submit").status())
        .isEqualTo(200);

    Answer read = as(LocalAws.ADA).get("/applications/" + applicationId);

    assertThat(read.status()).isEqualTo(200);
    assertThat(read.list("timeline")).hasSize(1);
    assertThat(read.text("timeline.0.from")).isEqualTo("draft");
    assertThat(read.text("timeline.0.to")).isEqualTo("submitted");
    assertThat(read.text("timeline.0.actorName")).isEqualTo("Ada Lovelace");
    assertThat(read.text("timeline.0.at")).isEqualTo("2026-11-19T09:30:00Z");
    assertThat(read.text("timeline.0.reason")).isNull();
  }
}
