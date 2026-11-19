package com.darkowl.tuition.applications;

import com.darkowl.contract.model.ApplicationDraft;
import com.darkowl.contract.model.ApplicationSummary;

/**
 * The crossing between this module's own types and the models generated from
 * {@code contract/openapi.yaml}: what an Applicant entered on the way in, and what
 * a screen reads on the way out.
 *
 * <p>It is here rather than in the controller so that the controller is routing and
 * nothing else, and here rather than on {@link Application} so that the aggregate
 * stays about an Application's behaviour. Everything the contract shapes is in one
 * file, which is where a contract change (ADR 0004) lands.
 *
 * <p>{@link StatusChange} and {@link ApplicationStatus} still render themselves:
 * they are small enough that their own {@code asContract()} is easier to read beside
 * the thing it describes, and this delegates to them.
 */
final class ContractModels {

  private ContractModels() {}

  /**
   * The Course an Applicant entered. A Draft is filled in over several visits, so
   * every detail may be absent, and a draft with no Course at all is a Course with
   * nothing in it rather than nothing.
   */
  static Course courseIn(ApplicationDraft draft) {
    com.darkowl.contract.model.Course entered = draft.getCourse();
    if (entered == null) {
      return new Course(null, null, null, null, null, null);
    }
    return new Course(
        entered.getInstitution(),
        entered.getTitle(),
        entered.getStartDate(),
        entered.getEndDate(),
        Amounts.read(entered.getCost()),
        entered.getDegreeProgram());
  }

  /** One Application in full, with its Course details and its Timeline. */
  static com.darkowl.contract.model.Application asContract(Application application) {
    com.darkowl.contract.model.Application body =
        new com.darkowl.contract.model.Application(
            application.applicationId(),
            application.status().asContract(),
            asContract(application.course()),
            application.createdAt(),
            application.updatedAt(),
            application.timeline().stream().map(StatusChange::asContract).toList());
    body.setEligibleCost(Amounts.write(application.eligibleCost()));
    return body;
  }

  /** One Application as it appears in the Applicant's own list. */
  static ApplicationSummary asSummary(Application application) {
    ApplicationSummary summary =
        new ApplicationSummary(
            application.applicationId(),
            application.status().asContract(),
            application.updatedAt());
    Course course = application.course();
    summary.setCourseTitle(course.title());
    summary.setCourseInstitution(course.institution());
    summary.setCourseStartDate(course.startDate());
    summary.setEligibleCost(Amounts.write(application.eligibleCost()));
    return summary;
  }

  private static com.darkowl.contract.model.Course asContract(Course course) {
    com.darkowl.contract.model.Course body = new com.darkowl.contract.model.Course();
    body.setInstitution(course.institution());
    body.setTitle(course.title());
    body.setStartDate(course.startDate());
    body.setEndDate(course.endDate());
    body.setCost(Amounts.write(course.cost()));
    body.setDegreeProgram(course.degreeProgram());
    return body;
  }
}
