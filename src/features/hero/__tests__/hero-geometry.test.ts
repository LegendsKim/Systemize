import { describe, it, expect } from "vitest";
import {
  desktopPlate,
  milestones,
  mobilePlate,
  toPercent,
  trailNodes,
} from "../hero-geometry";

/**
 * These tests guard the hero's core promise: the trail and its markers stay locked to the
 * artwork at every viewport size. That holds only while every coordinate lives in plate
 * space and the CSS stage keeps the plate's exact aspect ratio, so the invariants below
 * are what a future edit is most likely to break silently.
 */

const plates = [
  { name: "landscape", plate: desktopPlate, key: "desktop" as const },
  { name: "portrait", plate: mobilePlate, key: "mobile" as const },
];

describe.each(plates)("$name plate", ({ plate, key }) => {
  it("matches the aspect ratio hard-coded in hero.css", () => {
    // hero.css derives the stage's block size from these two numbers. If a plate is
    // replaced at a different ratio and the stylesheet is not updated, the artwork and
    // the overlay drift apart.
    const expected = key === "desktop" ? 1672 / 941 : 941 / 1672;
    expect(plate.width / plate.height).toBeCloseTo(expected, 6);
  });

  it("starts the trail with an absolute move and uses only cubic curves", () => {
    expect(plate.path.startsWith("M ")).toBe(true);
    const commands = plate.path.match(/[A-Za-z]/g) ?? [];
    expect(commands[0]).toBe("M");
    expect(new Set(commands.slice(1))).toEqual(new Set(["C"]));
  });

  it("keeps the whole trail inside the plate", () => {
    const numbers = plate.path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers.length % 2).toBe(0);

    for (let i = 0; i < numbers.length; i += 2) {
      expect(numbers[i]).toBeGreaterThanOrEqual(0);
      expect(numbers[i]).toBeLessThanOrEqual(plate.width);
      expect(numbers[i + 1]).toBeGreaterThanOrEqual(0);
      expect(numbers[i + 1]).toBeLessThanOrEqual(plate.height);
    }
  });

  it("keeps every milestone inside the plate", () => {
    for (const milestone of milestones) {
      const point = milestone[key];
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(plate.width);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(plate.height);
    }
  });

  it("draws a ring for every milestone except the first, which sits off the line", () => {
    expect(trailNodes(key)).toHaveLength(milestones.length - 1);
    expect(trailNodes(key)).not.toContainEqual(milestones[0]![key]);
  });
});

describe("milestones", () => {
  it("has a unique id and a distinct label for each stage", () => {
    expect(new Set(milestones.map((m) => m.id)).size).toBe(milestones.length);
    expect(new Set(milestones.map((m) => m.label)).size).toBe(milestones.length);
  });

  it("gives every milestone an accessible name richer than its visible label", () => {
    for (const milestone of milestones) {
      expect(milestone.description).toContain(milestone.label);
      expect(milestone.description.length).toBeGreaterThan(milestone.label.length);
    }
  });

  it("links every milestone to an in-page anchor", () => {
    for (const milestone of milestones) {
      expect(milestone.href.startsWith("#")).toBe(true);
    }
  });

  it("orders the portrait milestones down the plate, so none overlap the copy", () => {
    // On a phone the copy owns the top of the screen. Every marker must sit below it.
    for (const milestone of milestones) {
      expect(milestone.mobile.y).toBeGreaterThan(mobilePlate.height * 0.4);
    }
  });

  it("keeps portrait milestones clear of the horizontal crop", () => {
    // The portrait plate is cropped horizontally on a narrow phone. A marker too close
    // to either edge would be sliced off.
    for (const milestone of milestones) {
      expect(milestone.mobile.x).toBeGreaterThan(mobilePlate.width * 0.2);
      expect(milestone.mobile.x).toBeLessThan(mobilePlate.width * 0.8);
    }
  });
});

describe("toPercent", () => {
  it("converts a plate coordinate to a percentage of the plate", () => {
    expect(toPercent(836, 1672)).toBe("50.0000%");
    expect(toPercent(0, 1672)).toBe("0.0000%");
    expect(toPercent(1672, 1672)).toBe("100.0000%");
  });

  it("keeps enough precision that a marker does not visibly drift on a wide screen", () => {
    // Four decimal places is under a tenth of a pixel across a 4K stage.
    const drift = Math.abs(Number.parseFloat(toPercent(1092, 1672)) / 100 - 1092 / 1672);
    expect(drift * 3840).toBeLessThan(0.1);
  });
});
