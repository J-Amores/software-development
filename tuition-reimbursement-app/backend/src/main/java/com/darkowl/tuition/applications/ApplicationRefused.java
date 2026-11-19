package com.darkowl.tuition.applications;

import com.darkowl.contract.model.Problem;
import com.darkowl.contract.model.Violation;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

/**
 * Why a request about an Application was refused, in a form a screen can act on:
 * which fields are at fault and what is wrong with each, in the shape of RFC 9457
 * (the contract's {@code Problem}).
 */
class ApplicationRefused extends RuntimeException {

  private final HttpStatus status;
  private final String title;
  private final List<Violation> violations;

  private ApplicationRefused(
      HttpStatus status, String title, String detail, List<Violation> violations) {
    super(detail);
    this.status = status;
    this.title = title;
    this.violations = violations;
  }

  /**
   * No such Application, or it belongs to another Person. The two are the same
   * answer on purpose, so nobody can learn that someone else's Application exists.
   */
  static ApplicationRefused noSuchApplication() {
    return new ApplicationRefused(
        HttpStatus.NOT_FOUND,
        "No such Application",
        "There is no Application with that id that you are the Applicant of.",
        List.of());
  }

  static ApplicationRefused notADraftAnyMore(ApplicationStatus status) {
    return new ApplicationRefused(
        HttpStatus.CONFLICT,
        "This Application is no longer a Draft",
        "It is " + status.asContract().getValue() + ", so it cannot be changed or submitted again.",
        List.of());
  }

  static ApplicationRefused eligibleCostAboveTheCourseCost() {
    return new ApplicationRefused(
        HttpStatus.BAD_REQUEST,
        "The Eligible Cost is more than the Course costs",
        "The Eligible Cost is the part of the Course cost the Program will reimburse,"
            + " so it cannot be more than the Course cost.",
        List.of(
            violation(
                "eligibleCost", "This cannot be more than what the Course costs.")));
  }

  /**
   * What the Applicant has not entered yet, each named the way the contract names
   * the field, so a screen can point at the one at fault.
   *
   * @param missing the contract's own field paths, such as {@code course.title}
   */
  static ApplicationRefused detailsMissing(List<String> missing) {
    return new ApplicationRefused(
        HttpStatus.BAD_REQUEST,
        "This Application is not ready to submit",
        "Every Course detail and the Eligible Cost have to be entered before an Application"
            + " can be submitted.",
        missing.stream().map(field -> violation(field, PROMPTS.get(field))).toList());
  }

  static ApplicationRefused theCourseHasAlreadyStarted() {
    return new ApplicationRefused(
        HttpStatus.BAD_REQUEST,
        "This Course has already started",
        "The Program pre-approves a Course before it starts, so an Application has to be"
            + " submitted before the Course's start date.",
        List.of(violation("course.startDate", "The Course has to start after today.")));
  }

  HttpStatus status() {
    return status;
  }

  Problem asProblem() {
    Problem problem = new Problem(title, status.value());
    problem.setDetail(getMessage());
    if (!violations.isEmpty()) {
      problem.setViolations(violations);
    }
    return problem;
  }

  private static Violation violation(String field, String message) {
    return new Violation(field, message);
  }

  /**
   * What to tell the Applicant about each detail they have not entered, keyed by
   * the contract's own field path.
   */
  private static final Map<String, String> PROMPTS =
      Map.of(
          "course.institution", "Enter the school or college teaching the Course.",
          "course.title", "Enter what the Course is called.",
          "course.startDate", "Enter the day the Course starts.",
          "course.endDate", "Enter the day the Course ends.",
          "course.cost", "Enter what the Course costs.",
          "eligibleCost", "Enter the part of the Course cost the Program will reimburse.");
}
