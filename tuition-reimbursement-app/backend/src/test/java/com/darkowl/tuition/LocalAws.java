package com.darkowl.tuition;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AuthFlowType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AuthenticationResultType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.ExplicitAuthFlowsType;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;

/**
 * The AWS this suite needs, provisioned in the AWS Emulator by the suite itself.
 *
 * <p>CI starts the emulator and nothing else, so no bucket, user pool, app client
 * or Person exists when the suite runs; the seed script that provisions the local
 * stack is not part of it. Everything here is therefore created once per JVM, and
 * the Cognito ids it gets back are fed into the application context, because a
 * user pool's token issuer is fixed when the pool is created and cannot be known
 * in advance (ADR 0009).
 *
 * <p>Tokens are the <em>identity</em> token, which is the one the app accepts: it
 * carries the Person's name and email, and the resource server rejects an access
 * token in its place.
 */
final class LocalAws {

  /** Where Supporting Documents go. A bucket of this suite's own, not the stack's. */
  static final String DOCUMENTS_BUCKET = "tuition-test-documents";

  private static final String PASSWORD = "Passw0rd!2026";

  /** The two Applicants every test signs in as. Two, so one can be told from the other. */
  static final Person ADA = new Person("ada@darkowl.test", "Ada", "Lovelace");

  static final Person GRACE = new Person("grace@darkowl.test", "Grace", "Hopper");

  private static Cognito cognito;

  private LocalAws() {}

  /**
   * A Person with an account in the emulator's user pool.
   *
   * @param username the email they sign in with, which is also their email claim
   * @param givenName their first name, half of the display name the app reads
   * @param familyName their last name, the other half
   */
  record Person(String username, String givenName, String familyName) {

    String displayName() {
      return givenName + " " + familyName;
    }
  }

  /**
   * What the app has to be told about the pool that was created for this run.
   *
   * @param issuer the exact {@code iss} claim the pool puts in its tokens
   * @param jwkSetUri where this JVM can fetch the pool's signing keys
   * @param audience the app client the tokens are for
   */
  record Cognito(String issuer, String jwkSetUri, String audience) {}

  static synchronized Cognito cognito() {
    if (cognito == null) {
      EmulatorEnvironment.configure();
      cognito = provisionCognito();
    }
    return cognito;
  }

  static void documentsBucket() {
    EmulatorEnvironment.configure();
    try (S3Client s3 =
        S3Client.builder()
            .forcePathStyle(true)
            .endpointOverride(URI.create(EmulatorEnvironment.endpoint()))
            .build()) {
      try {
        s3.createBucket(request -> request.bucket(DOCUMENTS_BUCKET));
      } catch (BucketAlreadyOwnedByYouException alreadyThere) {
        // The emulator keeps no state between runs, so this only happens when a
        // previous suite in the same run made it.
      }
    }
  }

  /** The identity token the app accepts, for this Person. */
  static String identityTokenFor(Person person) {
    return authenticate(person).idToken();
  }

  /** An access token for the same Person, which the app must refuse. */
  static String accessTokenFor(Person person) {
    return authenticate(person).accessToken();
  }

  private static AuthenticationResultType authenticate(Person person) {
    Cognito pool = cognito();
    try (CognitoIdentityProviderClient identity = identityProvider()) {
      return identity
          .initiateAuth(
              request ->
                  request
                      .clientId(pool.audience())
                      .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                      .authParameters(
                          Map.of("USERNAME", person.username(), "PASSWORD", PASSWORD)))
          .authenticationResult();
    }
  }

  private static Cognito provisionCognito() {
    try (CognitoIdentityProviderClient identity = identityProvider()) {
      String poolId =
          identity
              .createUserPool(request -> request.poolName("tuition-test-" + UUID.randomUUID()))
              .userPool()
              .id();
      String clientId =
          identity
              .createUserPoolClient(
                  request ->
                      request
                          .userPoolId(poolId)
                          .clientName("tuition-test")
                          .generateSecret(false)
                          .explicitAuthFlows(
                              ExplicitAuthFlowsType.ALLOW_USER_PASSWORD_AUTH,
                              ExplicitAuthFlowsType.ALLOW_REFRESH_TOKEN_AUTH))
              .userPoolClient()
              .clientId();
      createPerson(identity, poolId, ADA);
      createPerson(identity, poolId, GRACE);
      return new Cognito(issuerOf(poolId), jwkSetUriOf(poolId), clientId);
    }
  }

  private static void createPerson(
      CognitoIdentityProviderClient identity, String poolId, Person person) {
    identity.adminCreateUser(
        request ->
            request
                .userPoolId(poolId)
                .username(person.username())
                .userAttributes(
                    attribute("email", person.username()),
                    attribute("given_name", person.givenName()),
                    attribute("family_name", person.familyName())));
    identity.adminSetUserPassword(
        request ->
            request
                .userPoolId(poolId)
                .username(person.username())
                .password(PASSWORD)
                .permanent(true));
  }

  private static AttributeType attribute(String name, String value) {
    return AttributeType.builder().name(name).value(value).build();
  }

  /**
   * The {@code iss} claim the pool will actually put in its tokens, read from the
   * pool's own discovery document. The emulator fixes it from the address the
   * creating request used, so asking is the only way to be right (ADR 0009).
   */
  private static String issuerOf(String poolId) {
    String discovery =
        EmulatorEnvironment.endpoint() + "/" + poolId + "/.well-known/openid-configuration";
    try (HttpClient http = HttpClient.newHttpClient()) {
      HttpResponse<String> response =
          http.send(
              HttpRequest.newBuilder(URI.create(discovery)).GET().build(),
              HttpResponse.BodyHandlers.ofString());
      JsonNode document = JsonMapper.builder().build().readTree(response.body());
      return document.path("issuer").asText();
    } catch (InterruptedException interrupted) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Interrupted reading " + discovery, interrupted);
    } catch (Exception cannotRead) {
      throw new IllegalStateException("Could not read " + discovery, cannotRead);
    }
  }

  /**
   * Where the keys are fetched from, which is deliberately not derived from the
   * issuer: the issuer is an address this JVM may not be able to reach, and the
   * app takes the two as separate settings for exactly that reason.
   */
  private static String jwkSetUriOf(String poolId) {
    return EmulatorEnvironment.endpoint() + "/" + poolId + "/.well-known/jwks.json";
  }

  private static CognitoIdentityProviderClient identityProvider() {
    return CognitoIdentityProviderClient.builder()
        .endpointOverride(URI.create(EmulatorEnvironment.endpoint()))
        .build();
  }
}
