import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, vi } from "vitest";
import { mockApi } from "../mocks/server";

/**
 * Every frontend test runs against the mock generated from the contract, with no
 * request allowed to escape it: a call the contract does not describe fails the
 * test rather than reaching the network.
 *
 * The mock starts here, as this file is loaded, rather than in a `beforeAll`.
 * `api/client.ts` keeps hold of the `fetch` it finds when it is first imported,
 * and a test file is imported before any hook runs, so a mock started in a hook
 * would be installed too late to be the `fetch` the client uses.
 */
mockApi.listen({ onUnhandledFrame: "error" });

afterEach(() => {
  cleanup();
  mockApi.resetHandlers();
  vi.useRealTimers();
});

afterAll(() => mockApi.close());
