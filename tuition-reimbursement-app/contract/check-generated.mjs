// Fails when the generated client in the repository is not what the contract
// produces right now, so the frontend can never drift from the contract
// (ADR 0004). Run by CI and by `npm run check`.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const committed = "../web/src/api/generated/schema.d.ts";
const scratch = mkdtempSync(join(tmpdir(), "contract-check-"));
const fresh = join(scratch, "schema.d.ts");

try {
  execFileSync("npx", ["openapi-typescript", "openapi.yaml", "-o", fresh], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  const before = readFileSync(committed, "utf8");
  const after = readFileSync(fresh, "utf8");
  if (before !== after) {
    console.error(
      `${committed} is not what contract/openapi.yaml generates.\n` +
        "Run `npm --prefix contract run generate` and commit the result; never hand-edit it.",
    );
    process.exit(1);
  }
  console.log("Generated client matches the contract.");
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
