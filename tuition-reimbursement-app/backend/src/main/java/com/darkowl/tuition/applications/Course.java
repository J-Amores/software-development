package com.darkowl.tuition.applications;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * The single class an Application is for.
 *
 * <p>Every detail is nullable because a Draft is filled in over several visits;
 * {@link #detailsMissingForSubmission()} is what submission asks. The cost is a
 * {@link BigDecimal} and never a float: an amount has to be exact to the cent.
 *
 * @param institution the school or college teaching the Course
 * @param title what the Course is called
 * @param startDate the day the Course starts, which the Program requires Pre-approval before
 * @param endDate the day the Course ends, which later starts the Completion Window
 * @param cost what the Course costs in full, which the Eligible Cost cannot exceed
 * @param degreeProgram the degree program it belongs to, where it belongs to one
 */
record Course(
    String institution,
    String title,
    LocalDate startDate,
    LocalDate endDate,
    BigDecimal cost,
    String degreeProgram) {

  /** Which Course details an Applicant still has to enter before submitting. */
  List<String> detailsMissingForSubmission() {
    List<String> missing = new ArrayList<>();
    if (isBlank(institution)) {
      missing.add("institution");
    }
    if (isBlank(title)) {
      missing.add("title");
    }
    if (startDate == null) {
      missing.add("startDate");
    }
    if (endDate == null) {
      missing.add("endDate");
    }
    if (cost == null) {
      missing.add("cost");
    }
    // The degree program is deliberately absent: a Course need not belong to one.
    return missing;
  }

  /**
   * Whether the Course had already started on this day in the Employer's time
   * zone. The Program's rule is that Pre-approval comes first, so a Course
   * starting today is already too late.
   */
  boolean hasStartedBy(LocalDate today) {
    return startDate != null && !startDate.isAfter(today);
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
