package com.darkowl.tuition;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The Course details and Eligible Cost an Applicant enters on a Draft, written the
 * way the contract describes them, so the tests read as the behavior and not as
 * JSON.
 */
final class Drafts {

  /**
   * A Course that starts well after the day the clock reads by default, so a
   * Draft for it can be submitted: the Program requires Pre-approval before the
   * Course starts.
   */
  static final LocalDate NEXT_TERM = LocalDate.of(2027, 1, 11);

  private Drafts() {}

  /** Every Course detail submission requires, and a degree program besides. */
  static Map<String, Object> aCompleteCourse() {
    Map<String, Object> course = new LinkedHashMap<>();
    course.put("institution", "Berklee College of Music");
    course.put("title", "Audio Mastering");
    course.put("startDate", NEXT_TERM.toString());
    course.put("endDate", NEXT_TERM.plusMonths(3).toString());
    course.put("cost", "2400.00");
    course.put("degreeProgram", "BSc Music Production");
    return course;
  }

  /** A Draft of a complete Course, with an Eligible Cost within the Course cost. */
  static Map<String, Object> aCompleteDraft() {
    return draftOf(aCompleteCourse(), "2000.00");
  }

  static Map<String, Object> draftOf(Map<String, Object> course) {
    Map<String, Object> draft = new LinkedHashMap<>();
    draft.put("course", course);
    return draft;
  }

  static Map<String, Object> draftOf(Map<String, Object> course, String eligibleCost) {
    Map<String, Object> draft = draftOf(course);
    draft.put("eligibleCost", eligibleCost);
    return draft;
  }
}
