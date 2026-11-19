package com.darkowl.tuition;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.client.RestClient;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Seam 1: every backend behavior is tested by calling the real application over
 * HTTP, against real Postgres and the AWS Emulator (Testing Decisions).
 *
 * <p>This is the whole harness. Postgres comes from Testcontainers; the bucket,
 * the Cognito user pool, its app client and the two Applicants are provisioned in
 * the emulator by {@link LocalAws}, because CI starts the emulator and nothing
 * else. The ids that provisioning produces are only known then, so the issuer, the
 * key set and the audience are injected into the context afterwards.
 *
 * <p>Tests live in the application's own base package rather than a subpackage of
 * it: a subpackage would read as a seventh domain module to Spring Modulith.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
abstract class ApiTest {

  private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:18-alpine");

  private static final JsonMapper JSON = JsonMapper.builder().build();

  @LocalServerPort private int port;

  @Autowired private Environment environment;

  @Autowired private SettableClock clock;

  @DynamicPropertySource
  static void applicationUnderTest(DynamicPropertyRegistry properties) {
    EmulatorEnvironment.configure();
    POSTGRES.start();
    LocalAws.documentsBucket();
    LocalAws.Cognito cognito = LocalAws.cognito();

    // The five settings application.yaml has no default for.
    properties.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    properties.add("spring.datasource.username", POSTGRES::getUsername);
    properties.add("spring.datasource.password", POSTGRES::getPassword);
    properties.add("app.oidc.issuer", cognito::issuer);
    properties.add("app.oidc.jwk-set-uri", cognito::jwkSetUri);

    // Blank by default, and the app refuses to start without it, because a
    // deployment that did not set it would accept any client's tokens.
    properties.add("app.oidc.audience", cognito::audience);

    properties.add("app.s3.endpoint", EmulatorEnvironment::endpoint);
    properties.add("app.s3.documents-bucket", () -> LocalAws.DOCUMENTS_BUCKET);
    properties.add("app.s3.path-style-access", () -> true);
  }

  /**
   * Puts the clock back to the same moment before every test, so no test depends
   * on what an earlier one set.
   */
  @BeforeEach
  void startTheClockWhereEveryTestExpectsIt() {
    clock.set(TestClockConfiguration.DEFAULT_NOW);
  }

  /** Moves the app's idea of now (seam 2). */
  protected final void now(Instant now) {
    clock.set(now);
  }

  /** The API as this Applicant, signed in with their identity token. */
  protected final Caller as(LocalAws.Person person) {
    return new Caller(LocalAws.identityTokenFor(person));
  }

  /** The API with no token at all. */
  protected final Caller signedOut() {
    return new Caller(null);
  }

  /** The API with a token of the wrong kind: an access token, not an identity one. */
  protected final Caller withAnAccessTokenFor(LocalAws.Person person) {
    return new Caller(LocalAws.accessTokenFor(person));
  }

  /**
   * One caller of the API. Paths are relative to the context path the contract
   * serves the API under, so they read the way the contract writes them.
   */
  protected final class Caller {

    private final RestClient client;

    private Caller(String token) {
      RestClient.Builder builder =
          RestClient.builder()
              .requestFactory(new JdkClientHttpRequestFactory())
              .baseUrl("http://localhost:" + port + environment.getProperty("server.servlet.context-path", ""))
              // The tests read status codes, so a refusal is an answer, not a throw.
              .defaultStatusHandler(status -> true, (request, response) -> {});
      if (token != null) {
        builder = builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
      }
      this.client = builder.build();
    }

    public Answer get(String path) {
      return answer(client.get().uri(path).retrieve());
    }

    public Answer post(String path) {
      return answer(client.post().uri(path).retrieve());
    }

    public Answer post(String path, Object body) {
      return answer(withBody(HttpMethod.POST, path, body).retrieve());
    }

    public Answer patch(String path, Object body) {
      return answer(withBody(HttpMethod.PATCH, path, body).retrieve());
    }

    private RestClient.RequestBodySpec withBody(HttpMethod method, String path, Object body) {
      return client
          .method(method)
          .uri(path)
          .contentType(MediaType.APPLICATION_JSON)
          .body(serialize(body));
    }

    private Answer answer(RestClient.ResponseSpec response) {
      var entity = response.toEntity(String.class);
      return new Answer(entity.getStatusCode().value(), entity.getBody());
    }
  }

  /**
   * What the API answered: the status code and the body, read as JSON.
   *
   * @param status the HTTP status code
   * @param body the response body, as it came over the wire
   */
  protected record Answer(int status, String body) {

    /** The body as JSON, so a test can read the fields it is about. */
    public JsonNode json() {
      try {
        return JSON.readTree(body);
      } catch (Exception notJson) {
        throw new AssertionError("Expected a JSON body but got: " + body, notJson);
      }
    }

    /**
     * One part of the body, by dotted path. A step that is a number is a position
     * in an array, so {@code timeline.0.actorName} reads the first Status Change's
     * actor. What is not there comes back as a missing node.
     */
    public JsonNode at(String path) {
      JsonNode node = json();
      for (String step : path.split("\\.")) {
        node = step.matches("\\d+") ? node.path(Integer.parseInt(step)) : node.path(step);
      }
      return node;
    }

    /** One text field, by the same paths, or null where there is nothing there. */
    public String text(String path) {
      JsonNode node = at(path);
      return node.isMissingNode() || node.isNull() ? null : node.asText();
    }

    /** An array in the body, as a list, so a test can say how long it is. */
    public List<JsonNode> list(String path) {
      List<JsonNode> items = new ArrayList<>();
      at(path).forEach(items::add);
      return items;
    }

    /** The body itself, where the body is an array. */
    public List<JsonNode> list() {
      List<JsonNode> items = new ArrayList<>();
      json().forEach(items::add);
      return items;
    }
  }

  private static String serialize(Object body) {
    try {
      return body instanceof String already ? already : JSON.writeValueAsString(body);
    } catch (Exception cannotSerialize) {
      throw new IllegalArgumentException("Could not serialize " + body, cannotSerialize);
    }
  }

  /** A request body written the way the contract describes it. */
  protected static Map<String, Object> body(Object... keysAndValues) {
    var map = new java.util.LinkedHashMap<String, Object>();
    for (int i = 0; i < keysAndValues.length; i += 2) {
      map.put((String) keysAndValues[i], keysAndValues[i + 1]);
    }
    return map;
  }
}
