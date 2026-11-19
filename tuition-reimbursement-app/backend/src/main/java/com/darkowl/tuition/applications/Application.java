package com.darkowl.tuition.applications;

import com.darkowl.tuition.people.Person;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Embedded;
import org.springframework.data.relational.core.mapping.MappedCollection;
import org.springframework.data.relational.core.mapping.Table;

/**
 * A Person's request to have the tuition for one Course reimbursed.
 *
 * <p>The Application and its Status Changes are one aggregate (ADR 0007): the
 * Timeline is only ever read and written with the Application it belongs to, and
 * this class is the only thing that changes an Application's status.
 *
 * <p>The key is generated here, because Aurora DSQL has no sequences and no
 * identity columns (ADR 0003). Spring Data JDBC therefore cannot tell a new
 * Application from a stored one by a null key, which is what {@link Persistable}
 * answers.
 */
@Table("applications")
class Application implements Persistable<UUID> {

  @Id private final UUID applicationId;
  private final UUID applicantPersonId;
  private ApplicationStatus status;
  @Embedded.Nullable(prefix = "course_") private Course course;
  private BigDecimal eligibleCost;
  private final Instant createdAt;
  private Instant updatedAt;

  @MappedCollection(idColumn = "application_id")
  private final Set<StatusChange> timeline;

  @Transient private boolean justStarted;

  Application(
      UUID applicationId,
      UUID applicantPersonId,
      ApplicationStatus status,
      Course course,
      BigDecimal eligibleCost,
      Instant createdAt,
      Instant updatedAt,
      Set<StatusChange> timeline) {
    this.applicationId = applicationId;
    this.applicantPersonId = applicantPersonId;
    this.status = status;
    this.course = course;
    this.eligibleCost = eligibleCost;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.timeline = timeline == null ? new LinkedHashSet<>() : new LinkedHashSet<>(timeline);
  }

  /**
   * Starts an Application as a Draft. Starting one is not a Status Change — nothing
   * moved between statuses — so the Timeline is empty until it is submitted.
   */
  static Application startedBy(Person applicant, Course course, BigDecimal eligibleCost, Instant at) {
    checkTheEligibleCostFits(course, eligibleCost);
    Application application =
        new Application(
            UUID.randomUUID(),
            applicant.personId(),
            ApplicationStatus.DRAFT,
            course,
            eligibleCost,
            at,
            at,
            new LinkedHashSet<>());
    application.justStarted = true;
    return application;
  }

  /** Whether this Person is the Applicant, which is who may read and change it. */
  boolean belongsTo(Person person) {
    return applicantPersonId.equals(person.personId());
  }

  /** Replaces the Course details and Eligible Cost. Only a Draft can be changed. */
  void change(Course course, BigDecimal eligibleCost, Instant at) {
    requireADraft();
    checkTheEligibleCostFits(course, eligibleCost);
    this.course = course;
    this.eligibleCost = eligibleCost;
    this.updatedAt = at;
  }

  /**
   * Submits the Draft for Pre-approval and records the Status Change, with the
   * Applicant as actor and the time the clock reads.
   *
   * @param today the day it is in the Employer's time zone, where the Program counts days
   */
  void submit(Person applicant, LocalDate today, Instant at) {
    requireADraft();
    Course entered = course == null ? EMPTY_COURSE : course;
    List<String> missing = detailsMissingForSubmission(entered);
    if (!missing.isEmpty()) {
      throw ApplicationRefused.detailsMissing(missing);
    }
    if (entered.hasStartedBy(today)) {
      throw ApplicationRefused.theCourseHasAlreadyStarted();
    }
    timeline.add(
        StatusChange.recorded(
            timeline.size(),
            ApplicationStatus.DRAFT,
            ApplicationStatus.SUBMITTED,
            applicant.personId(),
            applicant.displayName(),
            at,
            null));
    this.status = ApplicationStatus.SUBMITTED;
    this.updatedAt = at;
  }

  UUID applicationId() {
    return applicationId;
  }

  ApplicationStatus status() {
    return status;
  }

  Course course() {
    return course == null ? EMPTY_COURSE : course;
  }

  BigDecimal eligibleCost() {
    return eligibleCost;
  }

  Instant createdAt() {
    return createdAt;
  }

  Instant updatedAt() {
    return updatedAt;
  }

  /** The Timeline: every Status Change on this Application, oldest first. */
  List<StatusChange> timeline() {
    return timeline.stream()
        .sorted(Comparator.comparingInt(StatusChange::timelinePosition))
        .toList();
  }

  @Override
  public UUID getId() {
    return applicationId;
  }

  @Override
  public boolean isNew() {
    return justStarted;
  }

  /**
   * What an Applicant still has to enter before submitting, each named the way the
   * contract names the field, so a screen can point at the one at fault.
   *
   * <p>The Course knows which of its own details are missing; the Eligible Cost is
   * the Application's, and submission needs it too. Pre-approval is a decision
   * about the Eligible Cost — an Approved Amount can be no more than the lower of
   * it and the Applicant's Remaining Allowance — so an Application without one
   * could never be pre-approved. A Draft may still be saved without it, which is
   * what makes it a Draft.
   */
  private List<String> detailsMissingForSubmission(Course entered) {
    List<String> missing = new ArrayList<>();
    for (String detail : entered.detailsMissingForSubmission()) {
      missing.add("course." + detail);
    }
    if (eligibleCost == null) {
      missing.add("eligibleCost");
    }
    return missing;
  }

  private void requireADraft() {
    if (status != ApplicationStatus.DRAFT) {
      throw ApplicationRefused.notADraftAnyMore(status);
    }
  }

  /**
   * The Eligible Cost is the part of the Course cost the Program will reimburse, so
   * it can never be more than the Course costs. Compared as exact decimals.
   */
  private static void checkTheEligibleCostFits(Course course, BigDecimal eligibleCost) {
    if (eligibleCost == null || course == null || course.cost() == null) {
      return;
    }
    if (eligibleCost.compareTo(course.cost()) > 0) {
      throw ApplicationRefused.eligibleCostAboveTheCourseCost();
    }
  }

  private static final Course EMPTY_COURSE = new Course(null, null, null, null, null, null);
}
