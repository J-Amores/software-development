// Generated from contract/openapi.yaml by contract/generate-mock.mjs.
// Do not make direct changes to the file: run `npm --prefix contract run generate`.
import { createOpenApiHttp } from "openapi-msw";
import type { paths } from "../../api/generated/schema";
import * as fixtures from "../fixtures";

const http = createOpenApiHttp<paths>({ baseUrl: "/api" });

/**
 * The path parameters a fixture may read. msw types them per path, so the one
 * generated call site widens them to the single shape every fixture accepts.
 */
type FixtureParams = Record<string, string | readonly string[]>;

/** One handler per operation the contract describes, in operationId order. */
export const handlers = [
  http.post("/applications", async ({ response, request, params }) =>
    response(201).json(await fixtures.createApplication({ request, params: params as FixtureParams }))),
  http.get("/applications/{applicationId}", async ({ response, request, params }) =>
    response(200).json(await fixtures.getApplication({ request, params: params as FixtureParams }))),
  http.get("/health", async ({ response, request, params }) =>
    response(200).json(await fixtures.getHealth({ request, params: params as FixtureParams }))),
  http.get("/me", async ({ response, request, params }) =>
    response(200).json(await fixtures.getMe({ request, params: params as FixtureParams }))),
  http.get("/applications", async ({ response, request, params }) =>
    response(200).json(await fixtures.listApplications({ request, params: params as FixtureParams }))),
  http.post("/applications/{applicationId}/submit", async ({ response, request, params }) =>
    response(200).json(await fixtures.submitApplication({ request, params: params as FixtureParams }))),
  http.patch("/applications/{applicationId}", async ({ response, request, params }) =>
    response(200).json(await fixtures.updateApplication({ request, params: params as FixtureParams }))),
];
