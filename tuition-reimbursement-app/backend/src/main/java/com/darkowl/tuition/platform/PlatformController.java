package com.darkowl.tuition.platform;

import com.darkowl.contract.api.PlatformApi;
import com.darkowl.contract.model.DependencyStatus;
import com.darkowl.contract.model.Health;
import com.darkowl.contract.model.Me;
import java.time.Clock;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.s3.S3Client;

/**
 * The walking skeleton's two operations. They implement the interface generated
 * from {@code contract/openapi.yaml}, so a controller that does not match the
 * contract does not compile (ADR 0004).
 */
@RestController
class PlatformController implements PlatformApi {

  private final JdbcClient database;
  private final S3Client s3;
  private final S3Properties s3Properties;
  private final Clock clock;

  PlatformController(JdbcClient database, S3Client s3, S3Properties s3Properties, Clock clock) {
    this.database = database;
    this.s3 = s3;
    this.s3Properties = s3Properties;
    this.clock = clock;
  }

  /**
   * Reports each dependency separately, so a failure says which one is down. The
   * Postgres check reads Flyway's own history table: it passes only once Flyway
   * has run, which is what the skeleton needs to prove, and needs no table of our
   * own.
   */
  @Override
  public ResponseEntity<Health> getHealth() {
    DependencyStatus postgres = check(this::flywayHasRun);
    DependencyStatus s3Bucket = check(this::documentsBucketExists);
    boolean up = postgres.getReachable() && s3Bucket.getReachable();
    Health health =
        new Health(up ? Health.StatusEnum.UP : Health.StatusEnum.DOWN, postgres, s3Bucket, clock.instant());
    return ResponseEntity.status(up ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(health);
  }

  /**
   * The signed-in Person, as the backend reads them from their token: never from a
   * request parameter, so a caller cannot claim to be someone else.
   *
   * <p>The contract's {@code Me.personId} is the token's subject, which is what it
   * says it carries, and what the skeleton has always answered. It is not a
   * Person's key; the {@code people} module is the only thing that turns a subject
   * into one.
   */
  @Override
  public ResponseEntity<Me> getMe() {
    SignedInPerson person = SignedInPerson.current();
    return ResponseEntity.ok(new Me(person.tokenSubject(), person.displayName(), person.email()));
  }

  private void flywayHasRun() {
    database.sql("select count(*) from flyway_schema_history").query(Integer.class).single();
  }

  private void documentsBucketExists() {
    s3.headBucket(request -> request.bucket(s3Properties.documentsBucket()));
  }

  private static DependencyStatus check(Runnable probe) {
    DependencyStatus status = new DependencyStatus(true);
    try {
      probe.run();
    } catch (RuntimeException unreachable) {
      status.setReachable(false);
      status.setDetail(unreachable.getClass().getSimpleName() + ": " + unreachable.getMessage());
    }
    return status;
  }
}
