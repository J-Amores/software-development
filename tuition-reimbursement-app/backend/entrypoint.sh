#!/bin/sh
# Locally the app talks to the AWS Emulator over HTTPS with a certificate the
# emulator generates fresh on every start, so the certificate is trusted here, at
# boot, rather than baked into the image. In AWS none of this runs: there is no
# EMULATOR_CA and no SEED_ENV, and the app trusts the JDK's own roots.
set -eu

# The ids the seed script created this time round (user pool, app client, bucket).
if [ -n "${SEED_ENV:-}" ]; then
  waited=0
  while [ ! -f "$SEED_ENV" ]; do
    [ "$waited" -ge 60 ] && echo "gave up waiting for $SEED_ENV" >&2 && exit 1
    sleep 1
    waited=$((waited + 1))
  done
  # shellcheck source=/dev/null
  . "$SEED_ENV"
  export APP_OIDC_ISSUER APP_OIDC_JWK_SET_URI APP_OIDC_AUDIENCE APP_S3_DOCUMENTS_BUCKET
fi

TRUST=""
if [ -n "${EMULATOR_CA:-}" ] && [ -f "${EMULATOR_CA}" ]; then
  cp "$JAVA_HOME/lib/security/cacerts" /tmp/truststore
  keytool -importcert -noprompt -alias aws-emulator -file "$EMULATOR_CA" \
    -keystore /tmp/truststore -storepass changeit >/dev/null
  TRUST="-Djavax.net.ssl.trustStore=/tmp/truststore -Djavax.net.ssl.trustStorePassword=changeit"
  echo "trusting the AWS Emulator's certificate from $EMULATOR_CA"
fi

# shellcheck disable=SC2086
exec java $TRUST ${JAVA_OPTS:-} -jar /app/app.jar
