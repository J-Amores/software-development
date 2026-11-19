package com.darkowl.tuition.applications;

import com.darkowl.contract.api.ApplicationsApi;
import com.darkowl.contract.model.ApplicationDraft;
import com.darkowl.contract.model.ApplicationSummary;
import com.darkowl.contract.model.Problem;
import com.darkowl.tuition.people.People;
import com.darkowl.tuition.people.Person;
import com.darkowl.tuition.platform.SignedInPerson;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;

/**
 * Drafting and submitting an Application. Implements the interface generated from
 * {@code contract/openapi.yaml}, so a controller that does not match the contract
 * does not compile (ADR 0004).
 *
 * <p>Who the Applicant is comes from the token on every operation, never from the
 * request, and an Application nobody signed in is the Applicant of answers the same
 * way as one that does not exist.
 *
 * <p>Routing, who is asking, and what to answer when the module refuses. The
 * Application's own rules are {@link Application}'s, and the crossing to and from
 * the contract's models is {@link ContractModels}'.
 */
@RestController
class ApplicationsController implements ApplicationsApi {

  private final Applications applications;
  private final People people;
  private final Clock clock;

  ApplicationsController(Applications applications, People people, Clock clock) {
    this.applications = applications;
    this.people = people;
    this.clock = clock;
  }

  @Override
  public ResponseEntity<com.darkowl.contract.model.Application> createApplication(
      ApplicationDraft draft) {
    Person applicant = applicant();
    Application started =
        Application.startedBy(
            applicant,
            ContractModels.courseIn(draft),
            Amounts.read(draft.getEligibleCost()),
            clock.instant());
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ContractModels.asContract(applications.save(started)));
  }

  @Override
  public ResponseEntity<com.darkowl.contract.model.Application> getApplication(UUID applicationId) {
    return ResponseEntity.ok(ContractModels.asContract(mine(applicationId)));
  }

  @Override
  public ResponseEntity<com.darkowl.contract.model.Application> updateApplication(
      UUID applicationId, ApplicationDraft draft) {
    Application application = mine(applicationId);
    application.change(
        ContractModels.courseIn(draft), Amounts.read(draft.getEligibleCost()), clock.instant());
    return ResponseEntity.ok(ContractModels.asContract(applications.save(application)));
  }

  @Override
  public ResponseEntity<com.darkowl.contract.model.Application> submitApplication(
      UUID applicationId) {
    Person applicant = applicant();
    Application application = mine(applicant, applicationId);
    application.submit(applicant, today(), clock.instant());
    return ResponseEntity.ok(ContractModels.asContract(applications.save(application)));
  }

  @Override
  public ResponseEntity<List<ApplicationSummary>> listApplications() {
    List<ApplicationSummary> mine =
        applications
            .findByApplicantPersonIdOrderByUpdatedAtDesc(applicant().personId())
            .stream()
            .map(ContractModels::asSummary)
            .toList();
    return ResponseEntity.ok(mine);
  }

  @ExceptionHandler(ApplicationRefused.class)
  ResponseEntity<Problem> refused(ApplicationRefused refusal) {
    return ResponseEntity.status(refusal.status())
        .contentType(MediaType.APPLICATION_PROBLEM_JSON)
        .body(refusal.asProblem());
  }

  /** The signed-in Person, as a Person of this Employer rather than a token subject. */
  private Person applicant() {
    SignedInPerson signedIn = SignedInPerson.current();
    return people.personWithSubject(
        signedIn.tokenSubject(), signedIn.displayName(), signedIn.email());
  }

  private Application mine(UUID applicationId) {
    return mine(applicant(), applicationId);
  }

  private Application mine(Person applicant, UUID applicationId) {
    return applications
        .findById(applicationId)
        .filter(application -> application.belongsTo(applicant))
        .orElseThrow(ApplicationRefused::noSuchApplication);
  }

  /** The day it is where the Program counts days: the Employer's time zone. */
  private LocalDate today() {
    return LocalDate.ofInstant(clock.instant(), clock.getZone());
  }
}
