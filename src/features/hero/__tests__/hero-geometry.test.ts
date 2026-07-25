import { describe, it, expect } from "vitest";
import {
  landscapePlate,
  milestones,
  toPercent,
  trailNodes,
} from "../hero-geometry";

/**
 * These tests guard the hero's central promise: the trail and its markers stay locked to
 * the artwork at every viewport size. That holds only while every coordinate lives in
 * plate space and the stylesheet's stage keeps the plate's exact aspect ratio, so the
 * invariants below are the ones a future edit is most likely to break silently.
 */

describe("landscape plate", () => {
  it("matches the dimensions hard-coded in hero.css", () => {
    // `--hero-plate-w` and `--hero-plate-h` in hero.css derive the stage's block size
    // from these. If the artwork is replaced at a different ratio and the stylesheet is
    // not updated, the overlay and the image drift apart.
    expect(landscapePlate.width).toBe(2848);
    expect(landscapePlate.height).toBe(1344);
  });

  it("starts the trail with an absolute move and uses only cubic curves", () => {
    expect(landscapePlate.path.startsWith("M ")).toBe(true);
    const commands = landscapePlate.path.match(/[A-Za-z]/g) ?? [];
    expect(commands[0]).toBe("M");
    expect(new Set(commands.slice(1))).toEqual(new Set(["C"]));
  });

  it("keeps the whole trail inside the plate", () => {
    const numbers = landscapePlate.path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers.length % 2).toBe(0);

    for (let i = 0; i < numbers.length; i += 2) {
      expect(numbers[i]).toBeGreaterThanOrEqual(0);
      expect(numbers[i]).toBeLessThanOrEqual(landscapePlate.width);
      expect(numbers[i + 1]).toBeGreaterThanOrEqual(0);
      expect(numbers[i + 1]).toBeLessThanOrEqual(landscapePlate.height);
    }
  });

  it("begins the trail at the first milestone, so the journey reads as continuous", () => {
    const [first] = milestones;
    expect(landscapePlate.path.startsWith(`M ${first!.point.x} ${first!.point.y}`)).toBe(true);
  });

  it("ends the trail at the last milestone", () => {
    const last = milestones[milestones.length - 1]!;
    expect(landscapePlate.path.trimEnd().endsWith(`${last.point.x} ${last.point.y}`)).toBe(true);
  });
});

describe("milestones", () => {
  it("keeps every milestone inside the plate", () => {
    for (const milestone of milestones) {
      expect(milestone.point.x).toBeGreaterThan(0);
      expect(milestone.point.x).toBeLessThan(landscapePlate.width);
      expect(milestone.point.y).toBeGreaterThan(0);
      expect(milestone.point.y).toBeLessThan(landscapePlate.height);
    }
  });

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

  it("gives every milestone a summary, which the portrait track renders", () => {
    for (const milestone of milestones) {
      expect(milestone.summary.trim().length).toBeGreaterThan(0);
    }
  });

  it("links every milestone to an in-page anchor", () => {
    for (const milestone of milestones) {
      expect(milestone.href.startsWith("#")).toBe(true);
    }
  });

  it("marks exactly one milestone with the pin, and it is the first", () => {
    // The pin anchors the start of the trail; the rest are pills on points the line runs
    // through. Two pins would mean two apparent starting points.
    const pins = milestones.filter((m) => m.marker === "pin");
    expect(pins).toHaveLength(1);
    expect(pins[0]).toBe(milestones[0]);
  });

  it("draws a ring for every milestone except the pinned first", () => {
    expect(trailNodes()).toHaveLength(milestones.length - 1);
    expect(trailNodes()).not.toContainEqual(milestones[0]!.point);
  });
});

describe("toPercent", () => {
  it("converts a plate coordinate to a percentage of the plate", () => {
    expect(toPercent(1424, 2848)).toBe("50.0000%");
    expect(toPercent(0, 2848)).toBe("0.0000%");
    expect(toPercent(2848, 2848)).toBe("100.0000%");
  });

  it("keeps enough precision that a marker does not visibly drift on a wide screen", () => {
    // Four decimal places is under a tenth of a pixel across a 4K stage.
    const exact = 1245 / landscapePlate.width;
    const rounded = Number.parseFloat(toPercent(1245, landscapePlate.width)) / 100;
    expect(Math.abs(rounded - exact) * 3840).toBeLessThan(0.1);
  });
});
