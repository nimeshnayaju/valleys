import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), "valleys-package-"));

try {
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, npm_config_cache: join(temporary, ".npm") }
    })
  )[0];
  assert.deepEqual(packed.files.map((file) => file.path).sort(), [
    "LICENSE",
    "README.md",
    "dist/index.d.ts",
    "dist/index.js",
    "package.json"
  ]);

  // Resolve the actual tarball as an installed package, outside the source checkout.
  const installed = join(temporary, "node_modules", "valleys");
  mkdirSync(installed, { recursive: true });
  execFileSync("tar", ["-xzf", join(temporary, packed.filename), "--strip-components=1", "-C", installed]);
  writeFileSync(join(temporary, "package.json"), '{"private":true,"type":"module"}\n');
  writeFileSync(
    join(temporary, "consumer.mjs"),
    `import assert from "node:assert/strict";
import { array, dateTime, object, optional, record, string, url, validate, ValidationError } from "valleys";
const input = { names: ["Ada"], links: { home: "https://example.com/" } };
validate(input, object({ names: array(string()), links: record(url()), note: optional(string()) }));
validate("2024-02-29T12:00:00Z", dateTime());
assert.throws(() => validate({ names: [1] }, object({ names: array(string()) })), (error) => {
  assert.ok(error instanceof ValidationError);
  assert.deepEqual(error.cause.path, ["names", 0]);
  return true;
});
assert.throws(() => validate("https://example.com", url()), ValidationError);
`
  );
  execFileSync(process.execPath, ["consumer.mjs"], { cwd: temporary, stdio: "inherit" });

  writeFileSync(
    join(temporary, "consumer.ts"),
    `import { object, optional, record, string, validate, type InferOutputOf } from "valleys";
const User = object({ name: string(), note: optional(string()), labels: record(string()) });
declare const input: unknown;
validate(input, User);
const name: string = input.name;
const labels: Record<string, string> = input.labels;
const valid: InferOutputOf<typeof User> = { name, labels };
// @ts-expect-error present undefined is not an optional wire-data value
const invalid: InferOutputOf<typeof User> = { name, labels, note: undefined };
void valid;
void invalid;
`
  );
  writeFileSync(
    join(temporary, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        strict: true,
        exactOptionalPropertyTypes: true,
        noEmit: true,
        types: []
      },
      files: ["consumer.ts"]
    })
  );
  execFileSync(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"], {
    cwd: temporary,
    stdio: "inherit"
  });
  console.log(`Verified ${packed.filename}: package contents, ESM imports, validation, and TypeScript declarations.`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
