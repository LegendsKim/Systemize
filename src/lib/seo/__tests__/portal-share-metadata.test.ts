import { describe, expect, it } from "vitest";
import {
  portalShareImagePath,
  portalShareMetadata,
} from "../portal-share-metadata";

describe("portalShareMetadata", () => {
  it("keeps shared portal links private from search while exposing a social card", () => {
    const metadata = portalShareMetadata({
      path: "/invite/token",
      title: "הזמנה אישית",
      description: "כניסה מאובטחת",
    });

    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
      noarchive: true,
    });
    expect(metadata.openGraph).toMatchObject({
      url: "/invite/token",
      images: [
        {
          url: portalShareImagePath,
          width: 1200,
          height: 630,
        },
      ],
    });
  });

  it("does not require customer or project information", () => {
    const serialized = JSON.stringify(
      portalShareMetadata({
        path: "/login",
        title: "כניסה",
        description: "האזור האישי",
      })
    );

    expect(serialized).not.toContain("email");
    expect(serialized).not.toContain("projectId");
    expect(serialized).not.toContain("company");
  });
});
