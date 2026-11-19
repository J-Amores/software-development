// Generates the in-browser mock's handlers from contract/openapi.yaml, one per
// operation (ADR 0004, ADR 0005). The generated file holds no data of its own: each
// handler answers with the fixture named after its operation, from
// web/src/mocks/fixtures.ts. So a contract change that adds an operation adds a
// handler whose fixture does not exist yet, and the frontend stops typechecking
// until someone writes it — the mock cannot quietly fall behind the backend.
//
// Each fixture is handed the request and the path parameters, and may be async, so
// that the mock can answer from state the caller has changed rather than from canned
// data: a Draft saved through the mock is read back as it was entered. Demo mode
// needs exactly that (ADR 0005), and so do the frontend's tests of it (seam 3).
//
// Run by `npm --prefix contract run generate`. Never hand-edit the output.
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "yaml";

const METHODS = ["get", "put", "post", "delete", "patch", "head", "options"];
const OUT = "../web/src/mocks/generated/handlers.ts";

const spec = parse(readFileSync("openapi.yaml", "utf8"));
const baseUrl = (spec.servers?.[0]?.url ?? "/").replace(/\/$/, "");

const operations = [];
for (const [path, item] of Object.entries(spec.paths ?? {})) {
  for (const method of METHODS) {
    const operation = item[method];
    if (!operation) continue;
    if (!operation.operationId) {
      throw new Error(`${method.toUpperCase()} ${path} has no operationId to name its handler after`);
    }
    const success = Object.keys(operation.responses ?? {}).find((status) => /^2\d\d$/.test(status));
    if (!success) {
      throw new Error(`${operation.operationId} describes no 2xx response for the mock to answer with`);
    }
    operations.push({ path, method, operationId: operation.operationId, status: Number(success) });
  }
}
operations.sort((a, b) => a.operationId.localeCompare(b.operationId));

const handlers = operations
  .map(
    ({ path, method, operationId, status }) =>
      `  http.${method}("${path}", async ({ response, request, params }) =>\n` +
      `    response(${status}).json(await fixtures.${operationId}({ request, params: params as FixtureParams }))),`,
  )
  .join("\n");

writeFileSync(
  OUT,
  `// Generated from contract/openapi.yaml by contract/generate-mock.mjs.
// Do not make direct changes to the file: run \`npm --prefix contract run generate\`.
import { createOpenApiHttp } from "openapi-msw";
import type { paths } from "../../api/generated/schema";
import * as fixtures from "../fixtures";

const http = createOpenApiHttp<paths>({ baseUrl: "${baseUrl}" });

/**
 * The path parameters a fixture may read. msw types them per path, so the one
 * generated call site widens them to the single shape every fixture accepts.
 */
type FixtureParams = Record<string, string | readonly string[]>;

/** One handler per operation the contract describes, in operationId order. */
export const handlers = [
${handlers}
];
`,
);
console.log(`${OUT} <- ${operations.length} operation(s)`);
