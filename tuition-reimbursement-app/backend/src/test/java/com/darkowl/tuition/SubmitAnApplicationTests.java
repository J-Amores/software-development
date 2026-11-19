package com.darkowl.tuition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * An Applicant submits a Draft when it is ready, and the Program's rule that
 * Pre-approval comes first is enforced (ticket 02, tests 8 to 11 and 16).
 */
class SubmitAnApplicationTests extends ApiTest {

  /** 8. An Applicant submits a Draft and the Application becomes Submitted. */
  @Test
  void submittingADraftMakesTheApplicationSubmitted() {
    String applicationId = aCompleteDraftOf(LocalAws.ADA);

    Answer submitted = as(LocalAws.ADA).post("/applications/" + applicationId + "/submit");

    assertThat(submitted.status()).isEqualTo(200);
    assertThat(submitted.text("status")).isEqualTo("submitted");
  }

  /**
   * 9. Submitting an Application whose Course start date is today or earlier is
   * refused and the Application stays a Draft.
   */
  @Test
  void anApplicationForACourseThatHasAlreadyStartedCannotBeSubmitted() {
    // The clock reads 2026-11-18 in the Employer's time zone, where the Program's
    // days are counted.
    for (String startDate : new String[] {"2026-11-18", "2026-11-17"}) {
      Map<String, Object> course = Drafts.aCompleteCourse();
      course.put("startDate", startDate);
      course.put("endDate", "2027-02-18");
      String applicationId =
          as(LocalAws.ADA)
              .post("/applications", Drafts.draftOf(course, "2000.00"))
              .text("applicationId");

      Answer refused = as(LocalAws.ADA).post("/applications/" + applicationId + "/submit");

      assertThat(refused.status()).as("a Course starting %s", startDate).isEqualTo(400);
      assertThat(as(LocalAws.ADA).get("/applications/" + applicationId).text("status"))
          .as("a Course starting %s stays a Draft", startDate)
          .isEqualTo("draft");
    }
  }

  /** 10. Submitting an Application missing a required Course field is refused. */
  @Test
  void anApplicationMissingARequiredCourseDetailCannotBeSubmitted() {
    for (String missing : new String[] {"institution", "title", "startDate", "endDate", "cost"}) {
      Map<String, Object> course = Drafts.aCompleteCourse();
      course.remove(missing);
      String applicationId =
          as(LocalAws.ADA).post("/applications", Drafts.draftOf(course)).text("applicationId");

      Answer refused = as(LocalAws.ADA).post("/applications/" + applicationId + "/submit");

      assertThat(refused.status()).as("a Course with no %s", missing).isEqualTo(400);
      assertThat(refused.body()).as("the refusal says which detail", missing).contains(missing);
      assertThat(as(LocalAws.ADA).get("/applications/" + applicationId).text("status"))
          .as("a Course with no %s stays a Draft", missing)
          .isEqualTo("draft");
    }
  }

  /**
   * 11. Submitting records a Status Change with the Applicant as actor and the time
   * from the injected clock.
   */
  @Test
  void submittingRecordsAStatusChange() {
    Instant whenTheyPressedSubmit = Instant.parse("2026-11-20T15:04:05Z");
    String applicationId = aCompleteDraftOf(LocalAws.ADA);
    now(whenTheyPressedSubmit);

    Answer submitted = as(LocalAws.ADA).post("/applications/" + applicationId + "/submit");

    assertThat(submitted.status()).isEqualTo(200);
    assertThat(submitted.list("timeline")).hasSize(1);
    assertThat(submitted.text("timeline.0.from")).isEqualTo("draft");
    assertThat(submitted.text("timeline.0.to")).isEqualTo("submitted");
    assertThat(submitted.text("timeline.0.actorName")).isEqualTo(LocalAws.ADA.displayName());
    assertThat(submitted.text("timeline.0.at")).isEqualTo("2026-11-20T15:04:05Z");
  }

  /** 16. An Applicant cannot submit an Application that is already Submitted. */
  @Test
  void anApplicationCannotBeSubmittedTwice() {
    String applicationId = aCompleteDraftOf(LocalAws.ADA);
    assertThat(as(LocalAws.ADA).post("/applications/" + applicationId + "/submit").status())
        .isEqualTo(200);

    Answer again = as(LocalAws.ADA).post("/applications/" + applicationId + "/submit");

    assertThat(again.status()).isEqualTo(409);
    assertThat(as(LocalAws.ADA).get("/applications/" + applicationId).list("timeline")).hasSize(1);
  }

  private String aCompleteDraftOf(LocalAws.Person applicant) {
    return as(applicant).post("/applications", Drafts.aCompleteDraft()).text("applicationId");
  }
}
