package com.darkowl.tuition;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * An Applicant sees every Application they have with its current status, and
 * nobody else's (ticket 02, tests 12 and 13).
 *
 * <p>The assertions name the Applications the test itself created rather than the
 * whole list, so they say what they mean whatever else is in the database.
 */
class MyApplicationsTests extends ApiTest {

  /** 12. An Applicant lists their Applications and sees each one's current status. */
  @Test
  void anApplicantSeesEachApplicationsCurrentStatus() {
    String stillADraft = aDraftOf(LocalAws.ADA, "Analogue Synthesis");
    String submitted = aDraftOf(LocalAws.ADA, "Live Sound Engineering");
    assertThat(as(LocalAws.ADA).post("/applications/" + submitted + "/submit").status())
        .isEqualTo(200);

    Answer mine = as(LocalAws.ADA).get("/applications");

    assertThat(mine.status()).isEqualTo(200);
    assertThat(statusOf(mine, stillADraft)).isEqualTo("draft");
    assertThat(statusOf(mine, submitted)).isEqualTo("submitted");
  }

  /** 13. An Applicant's list contains their own Applications and no one else's. */
  @Test
  void anApplicantsListIsTheirsAlone() {
    String adas = aDraftOf(LocalAws.ADA, "Score Reading");
    String graces = aDraftOf(LocalAws.GRACE, "Studio Acoustics");

    assertThat(applicationIdsIn(as(LocalAws.ADA).get("/applications")))
        .contains(adas)
        .doesNotContain(graces);
    assertThat(applicationIdsIn(as(LocalAws.GRACE).get("/applications")))
        .contains(graces)
        .doesNotContain(adas);
  }

  private String aDraftOf(LocalAws.Person applicant, String courseTitle) {
    Map<String, Object> course = Drafts.aCompleteCourse();
    course.put("title", courseTitle);
    return as(applicant)
        .post("/applications", Drafts.draftOf(course, "2000.00"))
        .text("applicationId");
  }

  private static List<String> applicationIdsIn(Answer listed) {
    return listed.list().stream().map(entry -> entry.path("applicationId").asText()).toList();
  }

  private static String statusOf(Answer listed, String applicationId) {
    return listed.list().stream()
        .filter(entry -> applicationId.equals(entry.path("applicationId").asText()))
        .map(entry -> entry.path("status").asText())
        .findFirst()
        .orElseThrow(
            () -> new AssertionError("No Application " + applicationId + " in " + listed.body()));
  }
}
