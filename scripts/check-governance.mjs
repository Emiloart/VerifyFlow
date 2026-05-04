import { existsSync } from "node:fs";

const requiredFiles = [
  "AGENTS.md",
  "README.md",
  "CONTRIBUTING.md",
  ".github/pull_request_template.md",
  "docs/repo-structure.md",
  "docs/plans/README.md",
  "docs/plans/active/0001-verifyflow-phase1-reference-product.md",
  "docs/adr/README.md",
  "docs/adr/0001-verifyflow-product-boundary-and-stack.md",
  "docs/threat-model/README.md",
  "docs/threat-model/full/0001-verifyflow-phase1-reference-product.md",
  "docs/privacy/README.md",
  "docs/product/phase1-reference-flow.md",
  "docs/architecture/verifyflow-platform.md",
  "docs/runbooks/local-dev.md",
  "docs/runbooks/deployment.md",
  "docs/runbooks/secrets-and-incidents.md"
];

const missing = requiredFiles.filter((file) => !existsSync(file));

if (missing.length > 0) {
  console.error(`Missing governance files:\n${missing.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

console.log("Governance files present.");

