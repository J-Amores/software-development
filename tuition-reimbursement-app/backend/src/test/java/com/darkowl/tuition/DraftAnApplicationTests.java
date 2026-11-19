package com.darkowl.tuition;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * An Applicant starts an Application as a Draft, enters the Course they want
 * reimbursed, leaves the app, and comes back to it (ticket 02, tests 1 to 7).
 */
class DraftAnApplicationTests extends ApiTest {

  /** 1. An Applicant creates an Application and it starts as a Draft. */
  @Test
  void anApplicationStartsAsADraft() {
    Answer created = as(LocalAws.ADA).post("/applications", Drafts.aCompleteDraft());

    assertThat(created.status()).isEqualTo(201);
    assertThat(created.text("status")).isEqualTo("draft");
    assertThat(created.text("applicationId")).isNotBlank();
    // Starting a Draft is not a Status Change: nothing moved between statuses, so
    // the Timeline stays empty until the Application is submitted.
    assertThat(created.list("timeline")).isEmpty();
  }

  /** 2. A Draft records the Course's institution, title, start date, end date and cost. */
  @Test
  void aDraftRecordsTheCourse() {
    Answer created = as(LocalAws.ADA).post("/applications", Drafts.aCompleteDraft());

    assertThat(created.status()).isEqualTo(201);
    assertThat(created.text("course.institution")).isEqualTo("Berklee College of Music");
    assertThat(created.text("course.title")).isEqualTo("Audio Mastering");
    assertThat(created.text("course.startDate")).isEqualTo("2027-01-11");
    assertThat(created.text("course.endDate")).isEqualTo("2027-04-11");
    assertThat(created.text("course.cost")).isEqualTo("2400.00");
  }

  /** 3. A Draft records an optional degree program, and is valid without one. */
  @Test
  void aDegreeProgramIsOptional() {
    Answer withOne = as(LocalAws.ADA).post("/applications", Drafts.aCompleteDraft());
    assertThat(withOne.text("course.degreeProgram")).isEqualTo("BSc Music Production");

    Map<String, Object> courseOutsideADegree = Drafts.aCompleteCourse();
    courseOutsideADegree.remove("degreeProgram");
    Answer withoutOne =
        as(LocalAws.ADA).post("/applications", Drafts.draftOf(courseOutsideADegree, "2000.00"));

    assertThat(withoutOne.status()).isEqualTo(201);
    assertThat(withoutOne.text("course.degreeProgram")).isNull();
  }

  /** 4. A Draft records an Eligible Cost. */
  @Test
  void aDraftRecordsAnEligibleCost() {
    Answer created =
        as(LocalAws.ADA).post("/applications", Drafts.draftOf(Drafts.aCompleteCourse(), "1750.50"));

    assertThat(created.status()).isEqualTo(201);
    // Exact to the cent: an amount never passes through a binary float.
    assertThat(created.text("eligibleCost")).isEqualTo("1750.50");
  }

  /** 5. An Eligible Cost greater than the Course cost is refused. */
  @Test
  void anEligibleCostAboveTheCourseCostIsRefused() {
    Map<String, Object> course = Drafts.aCompleteCourse();
    course.put("cost", "1000.00");

    Answer refused = as(LocalAws.ADA).post("/applications", Drafts.draftOf(course, "1000.01"));

    assertThat(refused.status()).isEqualTo(400);
    assertThat(refused.body()).contains("eligibleCost");
  }

  /** 6. An Applicant updates their own Draft and the changes are kept. */
  @Test
  void anApplicantUpdatesTheirOwnDraft() {
    String applicationId =
        as(LocalAws.ADA).post("/applications", Drafts.aCompleteDraft()).text("applicationId");

    Map<String, Object> cheaperCourse = Drafts.aCompleteCourse();
    cheaperCourse.put("title", "Mixing for Vinyl");
    cheaperCourse.put("cost", "1800.00");
    Answer updated =
        as(LocalAws.ADA)
            .patch("/applications/" + applicationId, Drafts.draftOf(cheaperCourse, "1500.00"));

    assertThat(updated.status()).isEqualTo(200);
    assertThat(updated.text("status")).isEqualTo("draft");
    assertThat(updated.text("course.title")).isEqualTo("Mixing for Vinyl");
    assertThat(updated.text("course.cost")).isEqualTo("1800.00");
    assertThat(updated.text("eligibleCost")).isEqualTo("1500.00");
  }

  /** 7. An Applicant reading their Draft back later sees everything they entered. */
  @Test
  void anApplicantReadsTheirDraftBackLater() {
    Map<String, Object> course = Drafts.aCompleteCourse();
    course.put("institution", "Royal Academy of Music");
    course.put("title", "Orchestration");
    String applicationId =
        as(LocalAws.ADA)
            .post("/applications", Drafts.draftOf(course, "900.00"))
            .text("applicationId");

    Answer readBack = as(LocalAws.ADA).get("/applications/" + applicationId);

    assertThat(readBack.status()).isEqualTo(200);
    assertThat(readBack.text("applicationId")).isEqualTo(applicationId);
    assertThat(readBack.text("status")).isEqualTo("draft");
    assertThat(readBack.text("course.institution")).isEqualTo("Royal Academy of Music");
    assertThat(readBack.text("course.title")).isEqualTo("Orchestration");
    assertThat(readBack.text("course.startDate")).isEqualTo("2027-01-11");
    assertThat(readBack.text("course.endDate")).isEqualTo("2027-04-11");
    assertThat(readBack.text("course.cost")).isEqualTo("2400.00");
    assertThat(readBack.text("course.degreeProgram")).isEqualTo("BSc Music Production");
    assertThat(readBack.text("eligibleCost")).isEqualTo("900.00");
  }
}
