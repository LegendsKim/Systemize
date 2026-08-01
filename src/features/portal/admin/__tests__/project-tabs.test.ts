import { describe, expect, it } from "vitest";
import {
  adminProjectTabHref,
  resolveAdminProjectTab,
} from "../project-tabs";

describe("admin project tabs", () => {
  it("falls back to the overview for missing or unknown tab values", () => {
    expect(resolveAdminProjectTab(undefined)).toBe("overview");
    expect(resolveAdminProjectTab("invented")).toBe("overview");
  });

  it("keeps the active section in a shareable URL", () => {
    expect(resolveAdminProjectTab("documents")).toBe("documents");
    expect(adminProjectTabHref("project-id", "documents")).toBe(
      "/admin/projects/project-id?tab=documents"
    );
  });
});
