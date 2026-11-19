package com.darkowl.tuition;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Locale;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

/**
 * Where the AWS Emulator is and how to talk to it from a test JVM.
 *
 * <p>Seam 1 calls the real app against the AWS Emulator (Testing Decisions), which
 * serves HTTPS with a certificate it generates fresh on every start. The container
 * the app runs in trusts that certificate at boot (backend/entrypoint.sh); a test
 * JVM has no equivalent, so this class does the same job in process, before any
 * TLS connection is made. Without it both the AWS SDK's calls and the resource
 * server's fetch of the signing keys fail PKIX validation.
 *
 * <p>Region and credentials are taken from the environment when the runner sets
 * them (CI and {@code ./dev test} both do) and otherwise defaulted to what the
 * emulator writes beside its certificate, so the suite runs either way.
 */
final class EmulatorEnvironment {

  /** Where the emulator listens. Every local service reaches it here (ADR 0009). */
  private static final String DEFAULT_ENDPOINT = "https://127.0.0.1:9297";

  /** The directory the emulator writes its certificate and credentials to. */
  private static final Path DEFAULT_DIRECTORY = Paths.get("/emulator");

  private static final String TRUSTSTORE_PASSWORD = "changeit";

  private static boolean configured;

  private EmulatorEnvironment() {}

  static String endpoint() {
    String fromEnvironment = System.getenv("AWS_ENDPOINT_URL");
    return fromEnvironment == null || fromEnvironment.isBlank() ? DEFAULT_ENDPOINT : fromEnvironment;
  }

  /**
   * Makes this JVM able to reach the emulator: its certificate trusted, a Region
   * and credentials resolvable. Idempotent, and called before anything else here.
   */
  static synchronized void configure() {
    if (configured) {
      return;
    }
    configured = true;
    defaultRegion();
    defaultCredentials();
    trustTheEmulatorsCertificate();
  }

  private static void defaultRegion() {
    if (isBlank(System.getenv("AWS_REGION"))
        && isBlank(System.getenv("AWS_DEFAULT_REGION"))
        && isBlank(System.getProperty("aws.region"))) {
      System.setProperty("aws.region", "us-east-1");
    }
  }

  private static void defaultCredentials() {
    if (!isBlank(System.getenv("AWS_SHARED_CREDENTIALS_FILE"))
        || !isBlank(System.getenv("AWS_ACCESS_KEY_ID"))
        || !isBlank(System.getProperty("aws.accessKeyId"))) {
      return;
    }
    Path credentials = directory().resolve("emulator_credentials");
    if (Files.isReadable(credentials)) {
      System.setProperty("aws.sharedCredentialsFile", credentials.toString());
    }
  }

  /**
   * Adds the emulator's certificate authority to a copy of the JDK's own trust
   * store, so the emulator is trusted and everything the JDK already trusted still
   * is, and makes that the default for this JVM.
   *
   * <p>The trust store system properties alone are not enough: they are read when
   * the default {@code SSLContext} is first created, and by then the Docker client
   * Testcontainers uses may already have created it. Replacing the default context
   * outright works whenever this runs.
   */
  private static void trustTheEmulatorsCertificate() {
    Path authority = certificateAuthority();
    if (!Files.isReadable(authority)) {
      // Nothing to trust: either the emulator is not in play or the runner has
      // already pointed the JVM at a trust store of its own.
      return;
    }
    try {
      KeyStore trusted = jdkTrustStore();
      try (InputStream pem = Files.newInputStream(authority)) {
        X509Certificate certificate =
            (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(pem);
        trusted.setCertificateEntry("aws-emulator", certificate);
      }
      Path store = Files.createTempFile("aws-emulator-truststore", ".keystore");
      try (var out = Files.newOutputStream(store)) {
        trusted.store(out, TRUSTSTORE_PASSWORD.toCharArray());
      }
      System.setProperty("javax.net.ssl.trustStore", store.toString());
      System.setProperty("javax.net.ssl.trustStorePassword", TRUSTSTORE_PASSWORD);
      System.setProperty("javax.net.ssl.trustStoreType", trusted.getType().toUpperCase(Locale.ROOT));

      TrustManagerFactory trustManagers =
          TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
      trustManagers.init(trusted);
      SSLContext context = SSLContext.getInstance("TLS");
      context.init(null, trustManagers.getTrustManagers(), null);
      SSLContext.setDefault(context);
      HttpsURLConnection.setDefaultSSLSocketFactory(context.getSocketFactory());
    } catch (Exception cannotTrustIt) {
      throw new IllegalStateException(
          "Could not trust the AWS Emulator's certificate at " + authority, cannotTrustIt);
    }
  }

  private static KeyStore jdkTrustStore() throws Exception {
    Path cacerts = Paths.get(System.getProperty("java.home"), "lib", "security", "cacerts");
    // The JDK's trust store has been JKS and PKCS12 at different times; this
    // overload works out which from the file itself.
    return KeyStore.getInstance(cacerts.toFile(), TRUSTSTORE_PASSWORD.toCharArray());
  }

  private static Path certificateAuthority() {
    String bundle = System.getenv("AWS_CA_BUNDLE");
    return isBlank(bundle) ? directory().resolve("ca.pem") : Paths.get(bundle);
  }

  private static Path directory() {
    String bundle = System.getenv("AWS_CA_BUNDLE");
    if (isBlank(bundle)) {
      return DEFAULT_DIRECTORY;
    }
    Path parent = Paths.get(bundle).getParent();
    return parent == null ? DEFAULT_DIRECTORY : parent;
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
