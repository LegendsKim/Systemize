import { describe, expect, it } from "vitest";
import { isCurrentAdminRoute } from "../nav-state";

describe("isCurrentAdminRoute", () => {
  it("marks the overview only on the overview itself", () => {
    expect(isCurrentAdminRoute("/admin", "/admin")).toBe(true);

    // The regression this guards: `/admin` is a prefix of every other admin route, so a
    // startsWith test would highlight the overview on all four pages at once.
    for (const path of [
      "/admin/companies",
      "/admin/projects",
      "/admin/settings",
      "/admin/templates",
      "/admin/projects/abc",
    ]) {
      expect(isCurrentAdminRoute(path, "/admin")).toBe(false);
    }
  });

  it("marks a section on its own page and on its children", () => {
    expect(isCurrentAdminRoute("/admin/companies", "/admin/companies")).toBe(true);
    expect(
      isCurrentAdminRoute("/admin/companies/123/edit", "/admin/companies")
    ).toBe(true);
  });

  it("does not match a sibling whose name merely starts the same way", () => {
    expect(isCurrentAdminRoute("/admin/templates-archive", "/admin/templates")).toBe(
      false
    );
  });

  it("marks exactly one destination for every admin route", () => {
    const destinations = [
      "/admin",
      "/admin/companies",
      "/admin/projects",
      "/admin/settings",
      "/admin/templates",
    ];

    for (const path of destinations) {
      const matches = destinations.filter((href) =>
        isCurrentAdminRoute(path, href)
      );
      expect(matches).toEqual([path]);
    }

    expect(
      destinations.filter((href) =>
        isCurrentAdminRoute("/admin/projects/abc", href)
      )
    ).toEqual(["/admin/projects"]);
  });
});
