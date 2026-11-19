// Fails when anything generated from the contract and committed to the repository
// is not what the contract produces right now, so neither the frontend's client
// nor the demo's mock can drift from it (ADR 0004). Run by CI and `npm run check`.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const generated = [
  "../web/src/api/generated/schema.d.ts",
  "../web/src/mocks/generated/handlers.ts",
];

const before = generated.map((file) => readFileSync(file, "utf8"));
execFileSync("npm", ["run", "generate"], { stdio: ["ignore", "ignore", "inherit"] });
const after = generated.map((file) => readFileSync(file, "utf8"));

const stale = generated.filter((_, index) => before[index] !== after[index]);
if (stale.length > 0) {
  console.error(
    `Not what contract/openapi.yaml generates:\n  ${stale.join("\n  ")}\n` +
      "Run `npm --prefix contract run generate` and commit the result; never hand-edit it.",
  );
  process.exit(1);
}
console.log(`Everything generated from the contract is current (${generated.length} file(s)).`);
