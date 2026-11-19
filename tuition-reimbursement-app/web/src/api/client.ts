import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";
import { config } from "../config";
import { currentIdentityToken } from "../auth/session";

/**
 * The only way the app talks to the API. It is typed by the client generated from
 * contract/openapi.yaml, so a call the contract does not describe does not compile
 * (ADR 0004).
 */
export const api = createClient<paths>({ baseUrl: config.apiBaseUrl });

api.use({
  onRequest({ request }) {
    const token = currentIdentityToken();
    if (token) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    return request;
  },
});
