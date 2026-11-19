import { createOpenApiHttp } from "openapi-msw";
import type { paths } from "../api/generated/schema";

/**
 * The in-browser mock API (ADR 0005). It is typed by the client generated from
 * contract/openapi.yaml, so a handler for a path or a shape the contract does not
 * describe does not compile, and the mock cannot drift from the real backend.
 *
 * It answers with fixed data for now. The Faker fixtures and the domain rules the
 * demo needs arrive with ticket 16.
 */
const http = createOpenApiHttp<paths>({ baseUrl: "/api" });

export const handlers = [
  http.get("/health", ({ response }) =>
    response(200).json({
      status: "up",
      postgres: { reachable: true },
      s3: { reachable: true },
      time: new Date().toISOString(),
    }),
  ),

  http.get("/me", ({ response }) =>
    response(200).json({
      personId: "00000000-0000-4000-8000-000000000001",
      name: "Ada Lovelace",
      email: "ada@darkowl.test",
    }),
  ),
];
