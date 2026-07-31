import { describe, expect, it } from "vitest";
import {
  isCurrentPortalRoute,
  portalNavItems,
  portalSecondaryNavItems,
} from "../portal-nav-state";

/** The tab that would be highlighted on a given screen, by label. */
function activeLabels(pathname: string): string[] {
  return [...portalNavItems, ...portalSecondaryNavItems]
    .filter((item) => isCurrentPortalRoute(pathname, item.match))
    .map((item) => item.label);
}

describe("isCurrentPortalRoute", () => {
  it("highlights exactly one destination on every portal screen", () => {
    const screens = [
      "/portal",
      "/portal/actions",
      "/portal/documents",
      "/portal/documents/2f9c1f28-0000-4000-8000-000000000000",
      "/portal/notifications",
      "/portal/settings",
      "/portal/projects/2f9c1f28-0000-4000-8000-000000000000",
      "/portal/projects/2f9c1f28-0000-4000-8000-000000000000/discovery",
    ];

    for (const screen of screens) {
      expect(activeLabels(screen), screen).toHaveLength(1);
    }
  });

  it("puts each screen under the destination it belongs to", () => {
    expect(activeLabels("/portal")).toEqual(["בית"]);
    expect(activeLabels("/portal/actions")).toEqual(["פעולות"]);
    expect(activeLabels("/portal/documents")).toEqual(["מסמכים"]);
    expect(activeLabels("/portal/notifications")).toEqual(["עדכונים"]);
    expect(
      activeLabels("/portal/projects/2f9c1f28-0000-4000-8000-000000000000")
    ).toEqual(["פרויקט"]);
  });

  it("does not leave home lit up on every screen", () => {
    // The fault a naive prefix test produces, and the reason `בית` matches exactly.
    expect(activeLabels("/portal/actions")).not.toContain("בית");
    expect(activeLabels("/portal/documents")).not.toContain("בית");
  });

  it("treats a trailing slash as the same screen", () => {
    expect(activeLabels("/portal/")).toEqual(["בית"]);
    expect(activeLabels("/portal/actions/")).toEqual(["פעולות"]);
  });

  it("does not match a route that merely starts with the same letters", () => {
    expect(activeLabels("/portal/actionsomething")).toEqual([]);
  });

  it("keeps the prominent action tab from claiming other screens", () => {
    // The reported bug: "פעולות" stayed marked no matter where the visitor was.
    for (const screen of ["/portal", "/portal/documents", "/portal/settings"]) {
      expect(activeLabels(screen), screen).not.toContain("פעולות");
    }
  });
});

describe("portal navigation", () => {
  it("offers the five destinations the mobile bar is specified to carry", () => {
    expect(portalNavItems.map((item) => item.label)).toEqual([
      "בית",
      "פרויקט",
      "פעולות",
      "מסמכים",
      "עדכונים",
    ]);
  });

  it("marks exactly one destination as the prominent one", () => {
    expect(portalNavItems.filter((item) => item.primary)).toHaveLength(1);
  });
});
