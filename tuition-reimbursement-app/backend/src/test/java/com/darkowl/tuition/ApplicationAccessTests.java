package com.darkowl.tuition;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Who may touch an Application (ticket 02, tests 15 and 17).
 */
class ApplicationAccessTests extends ApiTest {

  /** 15. An Applicant cannot read, update or submit another Person's Application. */
  @Test
  void anApplicationBelongsToItsApplicantAlone() {
    String graces =
        as(LocalAws.GRACE).post("/applications", Drafts.aCompleteDraft()).text("applicationId");

    assertThat(as(LocalAws.ADA).get("/applications/" + graces).status()).isEqualTo(404);
    assertThat(as(LocalAws.ADA).patch("/applications/" + graces, Drafts.aCompleteDraft()).status())
        .isEqualTo(404);
    assertThat(as(LocalAws.ADA).post("/applications/" + graces + "/submit").status())
        .isEqualTo(404);

    // The same answer as for an Application that does not exist, so nobody can
    // learn that someone else's Application exists.
    String nobodys = UUID.randomUUID().toString();
    assertThat(as(LocalAws.ADA).get("/applications/" + nobodys).status()).isEqualTo(404);
    assertThat(as(LocalAws.ADA).patch("/applications/" + nobodys, Drafts.aCompleteDraft()).status())
        .isEqualTo(404);
    assertThat(as(LocalAws.ADA).post("/applications/" + nobodys + "/submit").status())
        .isEqualTo(404);

    // And Grace still has hers, untouched.
    Answer hers = as(LocalAws.GRACE).get("/applications/" + graces);
    assertThat(hers.status()).isEqualTo(200);
    assertThat(hers.text("status")).isEqualTo("draft");
  }

  /**
   * 17. A Person who is not signed in cannot create, read, update or submit an
   * Application.
   */
  @Test
  void anApplicationNeedsASignedInPerson() {
    String adas =
        as(LocalAws.ADA).post("/applications", Drafts.aCompleteDraft()).text("applicationId");

    assertThat(signedOut().post("/applications", Drafts.aCompleteDraft()).status()).isEqualTo(401);
    assertThat(signedOut().get("/applications").status()).isEqualTo(401);
    assertThat(signedOut().get("/applications/" + adas).status()).isEqualTo(401);
    assertThat(signedOut().patch("/applications/" + adas, Drafts.aCompleteDraft()).status())
        .isEqualTo(401);
    assertThat(signedOut().post("/applications/" + adas + "/submit").status()).isEqualTo(401);
  }
}
