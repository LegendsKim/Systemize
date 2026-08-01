import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const adminRoot = join(process.cwd(), "src", "app", "(admin)", "admin");

function collectAdminPages(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectAdminPages(path);
    }

    return entry.name === "page.tsx" ? [path] : [];
  });
}

describe("admin page authorization", () => {
  it.each(collectAdminPages(adminRoot))(
    "%s authorizes the owner before rendering",
    (pagePath) => {
      const source = readFileSync(pagePath, "utf8");

      expect(source).toContain('import { requireSystemizeOwner } from "@/features/portal/auth/session";');
      expect(source).toContain("await requireSystemizeOwner();");
    }
  );
});
