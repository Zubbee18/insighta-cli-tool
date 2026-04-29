import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

test("package.json has required fields", async () => {
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url)),
  );
  assert.ok(pkg.name, "name field must be present");
  assert.ok(pkg.version, "version field must be present");
  assert.ok(pkg.bin, "bin field must be present");
  assert.ok(pkg.bin.insighta, "insighta bin entry must be present");
});

test("entry point index.js exists", async () => {
  await assert.doesNotReject(
    access(new URL("../index.js", import.meta.url)),
    "index.js must exist",
  );
});

test("all command files are present", async () => {
  const commandFiles = [
    "login.js",
    "logout.js",
    "whoami.js",
    "getProfiles.js",
    "getProfilesById.js",
    "searchProfiles.js",
    "exportProfiles.js",
    "createProfiles.js",
  ];

  await Promise.all(
    commandFiles.map((file) =>
      assert.doesNotReject(
        access(new URL(`../commands/${file}`, import.meta.url)),
        `commands/${file} must exist`,
      ),
    ),
  );
});
