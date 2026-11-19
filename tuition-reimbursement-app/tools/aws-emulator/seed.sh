#!/bin/sh
# Provisions the AWS the app needs locally: the Supporting Documents bucket, a
# Cognito user pool with this deployment's app client and the demo people, and the
# Secrets Manager secret the database password would come from in AWS.
#
# Idempotent: it runs on every boot of the stack and re-uses whatever is already
# there. The emulator keeps no state between runs, so in practice it provisions
# from scratch each time, and the ids it gets are new each time. Those ids are
# written to /state/seed.env, which the backend and the frontend read at startup.
set -eu

: "${AWS_ENDPOINT_URL:?set by compose}"
: "${DOCUMENTS_BUCKET:=tuition-documents}"
: "${USER_POOL_NAME:=tuition-local}"
: "${APP_CLIENT_NAME:=tuition-web}"
: "${DEMO_PASSWORD:=Passw0rd!2026}"
STATE_FILE=${STATE_FILE:-/state/seed.env}

echo "seeding the emulator at $AWS_ENDPOINT_URL"

# ── S3: the Supporting Documents bucket ───────────────────────────────────────
if aws s3api head-bucket --bucket "$DOCUMENTS_BUCKET" 2>/dev/null; then
  echo "bucket $DOCUMENTS_BUCKET is already there"
else
  aws s3api create-bucket --bucket "$DOCUMENTS_BUCKET" >/dev/null
  echo "created bucket $DOCUMENTS_BUCKET"
fi
# Uploads and downloads go straight from the browser to S3 through presigned URLs
# (ticket 06), which needs the frontend's origin to be allowed.
aws s3api put-bucket-cors --bucket "$DOCUMENTS_BUCKET" --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": ["ETag"]
  }]
}' >/dev/null 2>&1 || echo "note: the emulator did not accept a CORS configuration; ticket 06 will revisit"

# ── Cognito: the user pool, this app's client, and the demo people ────────────
POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 \
  --query "UserPools[?Name=='$USER_POOL_NAME'].Id | [0]" --output text)
if [ "$POOL_ID" = "None" ] || [ -z "$POOL_ID" ]; then
  POOL_ID=$(aws cognito-idp create-user-pool --pool-name "$USER_POOL_NAME" \
    --query 'UserPool.Id' --output text)
  echo "created user pool $POOL_ID"
else
  echo "user pool $POOL_ID is already there"
fi

CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id "$POOL_ID" --max-results 60 \
  --query "UserPoolClients[?ClientName=='$APP_CLIENT_NAME'].ClientId | [0]" --output text)
if [ "$CLIENT_ID" = "None" ] || [ -z "$CLIENT_ID" ]; then
  CLIENT_ID=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$POOL_ID" --client-name "$APP_CLIENT_NAME" --no-generate-secret \
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --query 'UserPoolClient.ClientId' --output text)
  echo "created app client $CLIENT_ID"
else
  echo "app client $CLIENT_ID is already there"
fi

# The walking skeleton needs one Person to sign in as. The demo's cast of People
# comes from the Faker fixtures in ticket 16.
add_person() {
  username=$1; given=$2; family=$3
  if aws cognito-idp admin-get-user --user-pool-id "$POOL_ID" --username "$username" >/dev/null 2>&1; then
    echo "$username is already there"
    return
  fi
  aws cognito-idp admin-create-user --user-pool-id "$POOL_ID" --username "$username" \
    --user-attributes "Name=email,Value=$username" "Name=given_name,Value=$given" \
      "Name=family_name,Value=$family" >/dev/null
  aws cognito-idp admin-set-user-password --user-pool-id "$POOL_ID" --username "$username" \
    --password "$DEMO_PASSWORD" --permanent
  echo "created $username"
}
add_person "ada@darkowl.test" "Ada" "Lovelace"

# ── Secrets Manager: where the database password comes from in AWS ────────────
if aws secretsmanager describe-secret --secret-id tuition/db >/dev/null 2>&1; then
  echo "secret tuition/db is already there"
else
  aws secretsmanager create-secret --name tuition/db \
    --secret-string "{\"username\":\"tuition\",\"password\":\"${APP_DB_PASSWORD:-tuition}\"}" >/dev/null
  echo "created secret tuition/db"
fi

# ── What the rest of the stack needs to know ──────────────────────────────────
# The emulator fixes a user pool's token issuer when the pool is created, from the
# address the creating request used, so both the issuer and the key set are
# derived from the one endpoint this script talks to (ADR 0009). Hard-coding
# either would leave the backend rejecting every token with "the iss claim is not
# valid" as soon as the two addresses differed.
ISSUER="${AWS_ENDPOINT_URL%/}/$POOL_ID"
mkdir -p "$(dirname "$STATE_FILE")"
cat > "$STATE_FILE" <<ENV
APP_OIDC_ISSUER=$ISSUER
APP_OIDC_JWK_SET_URI=$ISSUER/.well-known/jwks.json
APP_OIDC_AUDIENCE=$CLIENT_ID
APP_S3_DOCUMENTS_BUCKET=$DOCUMENTS_BUCKET
VITE_COGNITO_USER_POOL_ID=$POOL_ID
VITE_COGNITO_CLIENT_ID=$CLIENT_ID
ENV
echo "wrote $STATE_FILE"
cat "$STATE_FILE"
