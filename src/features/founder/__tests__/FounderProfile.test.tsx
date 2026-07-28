import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FounderProfile } from "../components/FounderProfile";
import { founderContent } from "../founder-content";

/**
 * The founder section has two states that are correct rather than exceptional:
 * `portrait: null` and `credentials: []`. Both are the current values, and both must render
 * without an empty frame, an empty list, or an `<img>` pointing at an asset that does not
 * exist. These assertions are the guard on that contract.
 */
describe("FounderProfile", () => {
  it("renders no image and no broken asset reference while the portrait is null", () => {
    expect(founderContent.portrait).toBeNull();

    const { container } = render(<FounderProfile />);

    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(container.querySelector("img")).toBeNull();
    // The vector stand-in is decorative, so it is hidden from assistive technology.
    expect(container.querySelector(".founder-medallion")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("omits the credentials block entirely while nothing is verified", () => {
    expect(founderContent.credentials).toHaveLength(0);

    const { container } = render(<FounderProfile />);

    expect(container.querySelector(".founder-credentials")).toBeNull();
    expect(screen.queryAllByRole("definition")).toHaveLength(0);
  });

  it("labels the section by its own heading and keeps the name and pledge visible", () => {
    const { container } = render(<FounderProfile />);

    const section = container.querySelector("section");
    expect(section).toHaveAttribute("id", "founder");
    expect(section).toHaveAttribute("aria-labelledby", "founder-heading");

    expect(
      screen.getByRole("heading", { level: 2, name: founderContent.headline })
    ).toHaveAttribute("id", "founder-heading");
    expect(screen.getByText(founderContent.name)).toBeInTheDocument();
    expect(screen.getByText(founderContent.pledge)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: founderContent.ctaLabel })
    ).toHaveAttribute("href", founderContent.ctaHref);
  });
});
