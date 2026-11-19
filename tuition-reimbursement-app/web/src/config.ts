/**
 * Everything that differs between the local stack, the public demo and an
 * Employer's AWS account. All of it is configuration (ADR 0002): the local values
 * are set by the seed script at boot, and the AWS ones at build time.
 */
export const config = {
  /** Where the API is. CloudFront routes this path to the Lambda in AWS. */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  /** Cognito's endpoint. Locally the dev server proxies it to the AWS Emulator. */
  cognitoEndpoint: import.meta.env.VITE_COGNITO_ENDPOINT ?? "/cognito",
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
  /** Demo mode runs against the in-browser mock, with no backend at all (ADR 0005). */
  demoMode: import.meta.env.VITE_DEMO_MODE === "true",
  employerName: import.meta.env.VITE_EMPLOYER_NAME ?? "Dark Owl Records",
} as const;
