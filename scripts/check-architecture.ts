/**
 * Architecture Validators
 *
 * Executable checks for structural integrity of the Systemize boilerplate.
 * Run via: npm run check:architecture
 *
 * Each validator has positive and negative fixtures to prevent false positives.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const APP = path.join(SRC, "app");

interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
  files?: string[];
}

const results: ValidationResult[] = [];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function walkFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      files.push(...walkFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function relPath(filePath: string): string {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

// ---------------------------------------------------------------------------
// 1. AGENTS.client.md completeness check
// ---------------------------------------------------------------------------

function checkClientConfig(): void {
  const clientPath = path.join(ROOT, "AGENTS.client.md");
  if (!fs.existsSync(clientPath)) {
    // Mother repository mode — this is correct
    results.push({
      name: "AGENTS.client.md (mother repo)",
      passed: true,
      message: "No AGENTS.client.md found — correct for mother repository.",
    });
    return;
  }

  // Client repository mode — validate completeness
  const content = readFile(clientPath);

  if (content.includes("configuration_status: UNCONFIGURED")) {
    results.push({
      name: "AGENTS.client.md status",
      passed: false,
      message:
        "AGENTS.client.md has configuration_status: UNCONFIGURED. Complete all TODOs and set to APPROVED.",
    });
    return;
  }

  if (!content.includes("configuration_status: APPROVED")) {
    results.push({
      name: "AGENTS.client.md status",
      passed: false,
      message:
        "AGENTS.client.md must have configuration_status: APPROVED before implementation.",
    });
    return;
  }

  // Check for remaining TODOs
  const todoMatches = content.match(/\bTODO\b/g);
  if (todoMatches && todoMatches.length > 0) {
    results.push({
      name: "AGENTS.client.md TODOs",
      passed: false,
      message: `AGENTS.client.md contains ${todoMatches.length} unresolved TODO(s).`,
    });
    return;
  }

  results.push({
    name: "AGENTS.client.md",
    passed: true,
    message: "AGENTS.client.md is approved and complete.",
  });
}

// ---------------------------------------------------------------------------
// 2. Forbidden physical RTL layout utilities/properties
// ---------------------------------------------------------------------------

function checkPhysicalRTL(): void {
  const files = walkFiles(SRC, [".tsx", ".ts", ".css"]);
  const violations: string[] = [];

  // Tailwind physical directional utilities that should be logical
  // Match class usage in JSX className strings and CSS
  const physicalPatterns = [
    // Tailwind utilities: ml-*, mr-*, pl-*, pr-* (but not ms-*, me-*, ps-*, pe-*)
    /\b(?:m|p)[lr]-(?:\d|auto|px|\[)/,
    // text-left, text-right (should be text-start, text-end)
    /\btext-(?:left|right)\b/,
    // CSS properties: margin-left, margin-right, padding-left, padding-right
    /\bmargin-(?:left|right)\b/,
    /\bpadding-(?:left|right)\b/,
    // CSS left/right positioning (should be inset-inline-start/end)
    /\b(?:^|\s)(?:left|right)\s*:/,
    // border-left, border-right (should be border-inline-start/end)
    /\bborder-(?:left|right)(?:-width|-color|-style)?\b/,
    // Tailwind border radius: rounded-tl, rounded-tr, rounded-bl, rounded-br
    /\brounded-[tb][lr]\b/,
  ];

  for (const file of files) {
    // Skip this validator file itself and test fixtures
    if (file.includes("check-architecture")) continue;
    if (file.includes("__fixtures__")) continue;

    const content = readFile(file);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;

      // Skip comments
      if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*"))
        continue;

      for (const pattern of physicalPatterns) {
        if (pattern.test(line)) {
          violations.push(`${relPath(file)}:${i + 1}: ${line.trim()}`);
          break; // One violation per line is enough
        }
      }
    }
  }

  results.push({
    name: "Physical RTL layout",
    passed: violations.length === 0,
    message:
      violations.length === 0
        ? "No forbidden physical directional layout found."
        : `Found ${violations.length} physical RTL violation(s). Use logical properties (ms, me, ps, pe, start, end).`,
    files: violations.length > 0 ? violations.slice(0, 10) : undefined,
  });
}

// ---------------------------------------------------------------------------
// 3. Server-only imports in client graphs
// ---------------------------------------------------------------------------

function checkServerOnlyInClient(): void {
  const clientFiles = walkFiles(SRC, [".tsx", ".ts"]);
  const violations: string[] = [];

  for (const file of clientFiles) {
    const content = readFile(file);

    // Only check files that have "use client"
    if (!content.includes('"use client"') && !content.includes("'use client'"))
      continue;

    // Check for server-only imports
    const serverOnlyImports = [
      /from\s+['"]server-only['"]/,
      /import\s+['"]server-only['"]/,
      /from\s+['"]@\/lib\/env\/server['"]/,
      /from\s+['"]@\/lib\/supabase\/admin['"]/,
      /from\s+['"]@\/lib\/supabase\/server['"]/,
      /from\s+['"]@\/server\//,
    ];

    for (const pattern of serverOnlyImports) {
      if (pattern.test(content)) {
        violations.push(
          `${relPath(file)}: imports server-only module in client component`
        );
        break;
      }
    }
  }

  results.push({
    name: "Server-only in client",
    passed: violations.length === 0,
    message:
      violations.length === 0
        ? "No server-only imports in client components."
        : `Found ${violations.length} server-only import(s) in client components.`,
    files: violations.length > 0 ? violations : undefined,
  });
}

// ---------------------------------------------------------------------------
// 4. .env.example vs environment schema parity
// ---------------------------------------------------------------------------

function checkEnvParity(): void {
  const envExamplePath = path.join(ROOT, ".env.example");
  if (!fs.existsSync(envExamplePath)) {
    results.push({
      name: "Env parity",
      passed: false,
      message: ".env.example is missing.",
    });
    return;
  }

  const envContent = readFile(envExamplePath);
  const envKeys = new Set(
    envContent
      .split("\n")
      .filter((line) => line.match(/^[A-Z_]+=/) && !line.startsWith("#"))
      .map((line) => line.split("=")[0]!.trim())
  );

  // Read schema files to check for documented variables
  const serverSchemaPath = path.join(SRC, "lib", "env", "server.ts");
  const clientSchemaPath = path.join(SRC, "lib", "env", "client.ts");

  const missingFromExample: string[] = [];
  const schemaFiles = [serverSchemaPath, clientSchemaPath];

  for (const schemaFile of schemaFiles) {
    if (!fs.existsSync(schemaFile)) continue;
    const content = readFile(schemaFile);

    // Find env var references in schema (simple pattern matching)
    const envRefs = content.match(
      /(?:NEXT_PUBLIC_)?[A-Z][A-Z_]*[A-Z]/g
    );
    if (envRefs) {
      for (const ref of envRefs) {
        // Filter out common TypeScript/Zod keywords
        if (
          ["NEXT_PUBLIC", "NODE_ENV"].includes(ref) ||
          ref.length < 4
        )
          continue;
        if (!envKeys.has(ref)) {
          missingFromExample.push(ref);
        }
      }
    }
  }

  results.push({
    name: "Env parity",
    passed: missingFromExample.length === 0,
    message:
      missingFromExample.length === 0
        ? ".env.example matches environment schemas."
        : `Variables in schema but missing from .env.example: ${[...new Set(missingFromExample)].join(", ")}`,
  });
}

// ---------------------------------------------------------------------------
// 5. Required route/error conventions
// ---------------------------------------------------------------------------

function checkRouteConventions(): void {
  const missing: string[] = [];

  const requiredFiles = [
    "src/app/layout.tsx",
    "src/app/error.tsx",
    "src/app/global-error.tsx",
    "src/app/not-found.tsx",
    "src/app/robots.ts",
    "src/app/sitemap.ts",
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(ROOT, file))) {
      missing.push(file);
    }
  }

  // Verify global-error.tsx is self-contained (no app provider imports)
  const globalErrorPath = path.join(APP, "global-error.tsx");
  if (fs.existsSync(globalErrorPath)) {
    const content = readFile(globalErrorPath);
    if (
      content.includes("from '@/") &&
      !content.includes("from '@/lib") // Allow lib imports but not component/feature imports
    ) {
      // More specific check: disallow component and feature imports
      if (
        content.includes("from '@/components") ||
        content.includes("from '@/features")
      ) {
        missing.push(
          "global-error.tsx imports app components (must be self-contained)"
        );
      }
    }
  }

  results.push({
    name: "Route conventions",
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? "All required route conventions are present."
        : `Missing or invalid: ${missing.join(", ")}`,
  });
}

// ---------------------------------------------------------------------------
// 6. Deprecated version-sensitive conventions
// ---------------------------------------------------------------------------

function checkDeprecatedConventions(): void {
  const violations: string[] = [];
  const middlewarePath = path.join(SRC, "middleware.ts");
  const proxyPath = path.join(SRC, "proxy.ts");
  const nextConfigPath = path.join(ROOT, "next.config.ts");

  if (fs.existsSync(middlewarePath)) {
    violations.push("src/middleware.ts: use src/proxy.ts with Next.js 16+");
  }
  if (!fs.existsSync(proxyPath)) {
    violations.push("src/proxy.ts: required security boundary is missing");
  }
  if (
    fs.existsSync(nextConfigPath) &&
    /experimental\s*:\s*\{[\s\S]*serverActions/.test(readFile(nextConfigPath))
  ) {
    violations.push(
      "next.config.ts: experimental.serverActions is deprecated in Next.js 16+"
    );
  }

  results.push({
    name: "Version-sensitive conventions",
    passed: violations.length === 0,
    message:
      violations.length === 0
        ? "No deprecated Next.js conventions found."
        : `Found ${violations.length} deprecated convention(s).`,
    files: violations.length > 0 ? violations : undefined,
  });
}

// ---------------------------------------------------------------------------
// 7. Secret pattern detection in source
// ---------------------------------------------------------------------------

function checkSecrets(): void {
  const files = walkFiles(ROOT, [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
  const violations: string[] = [];

  // Patterns that suggest hardcoded secrets
  const secretPatterns = [
    /(?:password|passwd|secret|token|api_key|apikey|api[-_]?secret)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    /(?:eyJ[A-Za-z0-9_-]{10,}\.eyJ)/,  // JWT tokens
    /(?:sk_live_|pk_live_|rk_live_)/,    // Stripe live keys
    /(?:ghp_[A-Za-z0-9]{36})/,          // GitHub PAT
    /(?:xoxb-|xoxp-|xoxs-)/,           // Slack tokens
  ];

  for (const file of files) {
    // Skip node_modules and .next
    if (file.includes("node_modules") || file.includes(".next")) continue;
    // Skip test fixtures, test files, and this file
    if (
      file.includes("__fixtures__") ||
      file.includes("__tests__") ||
      file.includes(".test.") ||
      file.includes("check-architecture")
    )
      continue;

    const content = readFile(file);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      // Skip comments and test assertions
      if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*"))
        continue;
      if (line.includes(".env") || line.includes("process.env")) continue;
      if (line.includes("example") || line.includes("placeholder")) continue;

      for (const pattern of secretPatterns) {
        if (pattern.test(line)) {
          violations.push(`${relPath(file)}:${i + 1}: potential secret`);
          break;
        }
      }
    }
  }

  results.push({
    name: "Secret detection",
    passed: violations.length === 0,
    message:
      violations.length === 0
        ? "No potential secrets found in source."
        : `Found ${violations.length} potential secret(s) in source.`,
    files: violations.length > 0 ? violations.slice(0, 10) : undefined,
  });
}

// ---------------------------------------------------------------------------
// Run all validators
// ---------------------------------------------------------------------------

console.log("\n🔍 Architecture Validation\n");

checkClientConfig();
checkPhysicalRTL();
checkServerOnlyInClient();
checkEnvParity();
checkRouteConventions();
checkDeprecatedConventions();
checkSecrets();

let hasFailure = false;

for (const result of results) {
  const icon = result.passed ? "✅" : "❌";
  console.log(`${icon} ${result.name}: ${result.message}`);
  if (result.files) {
    for (const file of result.files) {
      console.log(`   → ${file}`);
    }
  }
  if (!result.passed) hasFailure = true;
}

console.log(
  `\n${hasFailure ? "❌ Architecture validation FAILED" : "✅ Architecture validation PASSED"}\n`
);

if (hasFailure) {
  process.exit(1);
}
