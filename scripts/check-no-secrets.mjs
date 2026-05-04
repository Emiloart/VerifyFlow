import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirectories = new Set(["node_modules", ".git", "dist", ".next", "coverage", "playwright-report", "test-results"]);
const tracked = listFiles(root);

const forbiddenPatterns = [
  /opaque-artifact:v1:[A-Za-z0-9._:-]+/,
  /Authorization:\s*Bearer\s+[A-Za-z0-9._-]+/i,
  /KYC_PROVIDER_[A-Z_]*CLIENT_SECRET=(?!replace-|example|placeholder)[^\n]+/
];

const findings = [];

for (const file of tracked) {
  if (relative(root, file) === "scripts\\check-no-secrets.mjs" || relative(root, file) === "scripts/check-no-secrets.mjs") {
    continue;
  }

  const content = readFileSync(file, "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      findings.push(relative(root, file));
      break;
    }
  }
}

if (findings.length > 0) {
  console.error(`Potential secret or sensitive fixture found:\n${findings.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

console.log("No obvious secrets or raw artifacts found.");

function listFiles(directory) {
  const entries = [];
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }

    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      entries.push(...listFiles(fullPath));
    } else if (stats.isFile()) {
      entries.push(fullPath);
    }
  }

  return entries;
}
