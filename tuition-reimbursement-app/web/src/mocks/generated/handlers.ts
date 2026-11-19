// Generated from contract/openapi.yaml by contract/generate-mock.mjs.
// Do not make direct changes to the file: run `npm --prefix contract run generate`.
import { createOpenApiHttp } from "openapi-msw";
import type { paths } from "../../api/generated/schema";
import * as fixtures from "../fixtures";

const http = createOpenApiHttp<paths>({ baseUrl: "/api" });

/** One handler per operation the contract describes, in operationId order. */
export const handlers = [
  http.get("/health", ({ response }) => response(200).json(fixtures.getHealth())),
  http.get("/me", ({ response }) => response(200).json(fixtures.getMe())),
];
