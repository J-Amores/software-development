import { config } from "../config";
import { rememberIdentityToken } from "./session";

/**
 * Sign-in is a Cognito user pool with local accounts. This is Cognito's own
 * InitiateAuth call, which needs no AWS credentials and no SDK: the browser posts
 * the user name and password and gets tokens back.
 *
 * The identity token is what the app sends to the API, because it is the token
 * that carries the Person's name and email.
 */
export class SignInRejected extends Error {}

interface InitiateAuthResponse {
  AuthenticationResult?: { IdToken?: string };
  ChallengeName?: string;
}

export async function signIn(username: string, password: string): Promise<void> {
  const response = await fetch(config.cognitoEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: config.cognitoClientId,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    }),
  });

  if (!response.ok) {
    throw new SignInRejected("That email and password do not match an account.");
  }

  const result = (await response.json()) as InitiateAuthResponse;
  const token = result.AuthenticationResult?.IdToken;
  if (!token) {
    throw new SignInRejected(
      result.ChallengeName
        ? "This account needs to be set up before it can sign in."
        : "Sign-in did not return a token.",
    );
  }
  rememberIdentityToken(token);
}
